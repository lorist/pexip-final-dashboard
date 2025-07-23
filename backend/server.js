// backend/server.js
const express = require('express');
const Redis = require('ioredis');
const cors = require('cors');
const Database = require('better-sqlite3'); // Import better-sqlite3

const app = express();
const PORT = process.env.PORT || 5000;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const REDIS_CHANNEL = 'pexip_events'; // Redis channel for Pexip events

// --- SQLite Initialization ---
// Database file will be stored in the /app/data volume
const dbPath = process.env.DB_PATH || '/app/data/pexip_events.db';
const db = new Database(dbPath);

// Create tables if they don't exist
// ADDED destinationAlias column to conferences table
db.exec(`
  CREATE TABLE IF NOT EXISTS conferences (
    conferenceAlias TEXT PRIMARY KEY,
    conferenceName TEXT,
    start_time TEXT,
    is_started INTEGER,
    is_locked INTEGER,
    destinationAlias TEXT  -- NEW COLUMN
  );

  CREATE TABLE IF NOT EXISTS participants (
    uuid TEXT PRIMARY KEY,
    conferenceAlias TEXT,
    display_name TEXT,
    role TEXT,
    is_muted INTEGER,
    is_video_muted INTEGER,
    is_presenting INTEGER,
    FOREIGN KEY (conferenceAlias) REFERENCES conferences(conferenceAlias) ON DELETE CASCADE
  );
`);

console.log(`SQLite database initialized at ${dbPath}`);
// --- End SQLite Initialization ---

// Initialize Redis clients
const publisher = new Redis(REDIS_URL);
const subscriber = new Redis(REDIS_URL);

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // To parse JSON request bodies

// --- Endpoint for Initial Data Fetch of ALL Conferences ---
app.get('/active-conferences-data', (req, res) => {
  try {
    const conferences = db.prepare('SELECT * FROM conferences').all();
    const result = conferences.map(conf => {
      const participants = db.prepare('SELECT * FROM participants WHERE conferenceAlias = ?').all(conf.conferenceAlias);
      return {
        ...conf,
        is_started: Boolean(conf.is_started), // Convert INTEGER to boolean
        is_locked: Boolean(conf.is_locked),   // Convert INTEGER to boolean
        participants: participants.map(p => ({ // Convert INTEGER to boolean for participant booleans
          ...p,
          is_muted: Boolean(p.is_muted),
          is_video_muted: Boolean(p.is_video_muted),
          is_presenting: Boolean(p.is_presenting)
        }))
      };
    });
    res.status(200).json(result);
    console.log(`Served initial active conferences data from SQLite. Count: ${result.length}`);
  } catch (error) {
    console.error('Error fetching initial active conferences data from SQLite:', error);
    res.status(500).json({ error: 'Failed to fetch initial data' });
  }
});

// --- NEW Endpoint for Specific Conference Participants ---
app.get('/active-conferences-data/:conferenceAlias/participants', (req, res) => {
  const { conferenceAlias } = req.params;
  try {
    const participants = db.prepare('SELECT * FROM participants WHERE conferenceAlias = ?').all(conferenceAlias);
    const parsedParticipants = participants.map(p => ({
      ...p,
      is_muted: Boolean(p.is_muted),
      is_video_muted: Boolean(p.is_video_muted),
      is_presenting: Boolean(p.is_presenting)
    }));
    res.status(200).json(parsedParticipants);
    console.log(`Served participants for conference '${conferenceAlias}'. Count: ${parsedParticipants.length}`);
  } catch (error) {
    console.error(`Error fetching participants for '${conferenceAlias}' from SQLite:`, error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});


// --- Webhook Receiver Endpoint ---
app.post('/webhook', async (req, res) => {
  const eventData = req.body;
  console.log('Received Pexip event (raw):', JSON.stringify(eventData, null, 2));

  const eventType = eventData.event;
  let conferenceAlias = null;
  let conferenceName = null;
  let sseData = null;
  let destinationAlias = null; // NEW: Variable to hold destination_alias

  // Robust extraction of conferenceAlias and conferenceName
  if (eventData.data) {
    if (eventData.data.name) {
      conferenceName = eventData.data.name;
      conferenceAlias = eventData.data.name;
    }
    if (eventData.data.conference) { // Often present in participant events
      conferenceAlias = eventData.data.conference;
      if (!conferenceName) {
        conferenceName = eventData.data.conference;
      }
    }
    // For participant events, display_name might be the only name available
    if (eventData.data.display_name && !conferenceName) {
      conferenceName = eventData.data.display_name;
    }
    // NEW: Extract destination_alias from participant events
    if (eventData.data.destination_alias) {
      destinationAlias = eventData.data.destination_alias;
    }
  }


  try {
    // Helper function to upsert conference (insert or update)
    const upsertConference = (alias, name, isStarted, isLocked, destAlias, startTime = new Date().toISOString()) => {
      // Fetch existing record to preserve destinationAlias if already set
      const existingConf = db.prepare('SELECT destinationAlias FROM conferences WHERE conferenceAlias = ?').get(alias);
      const currentDestAlias = existingConf ? existingConf.destinationAlias : null;
      const finalDestAlias = destAlias || currentDestAlias; // Prioritize new destAlias, else keep old

      db.prepare(`
        INSERT OR REPLACE INTO conferences (conferenceAlias, conferenceName, start_time, is_started, is_locked, destinationAlias)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(alias, name || alias, startTime, isStarted ? 1 : 0, isLocked ? 1 : 0, finalDestAlias);
    };

    switch (eventType) {
      case 'conference_started':
        sseData = {
          eventType: eventType,
          conferenceAlias: conferenceAlias,
          conferenceName: conferenceName,
          timestamp: new Date().toISOString()
        };
        // Pass destinationAlias as null initially, it will be updated by participant_connected
        upsertConference(conferenceAlias, conferenceName, true, false, null, sseData.timestamp);
        console.log(`SQLite: Conference '${conferenceAlias}' added/updated.`);
        break;

      case 'conference_ended':
        sseData = {
          eventType: eventType,
          conferenceAlias: conferenceAlias,
          conferenceName: conferenceName,
          timestamp: new Date().toISOString()
        };
        // Delete conference from SQLite (CASCADE will delete participants)
        const deleteConfStmt = db.prepare('DELETE FROM conferences WHERE conferenceAlias = ?');
        const delConfResult = deleteConfStmt.run(conferenceAlias);
        console.log(`SQLite: Conference '${conferenceAlias}' removed. Changes: ${delConfResult.changes}`);
        break;

      case 'conference_updated':
        sseData = {
          eventType: eventType,
          conferenceAlias: conferenceAlias,
          conferenceName: conferenceName,
          is_started: eventData.data.is_started,
          is_locked: eventData.data.is_locked,
          timestamp: new Date().toISOString()
        };
        // Update conference status in SQLite, preserve existing destinationAlias
        upsertConference(conferenceAlias, conferenceName, eventData.data.is_started, eventData.data.is_locked, null); // Pass null for destAlias, upsertConference will preserve it
        console.log(`SQLite: Conference '${conferenceAlias}' updated status.`);
        break;

      case 'participant_connected':
        if (conferenceAlias && eventData.data) {
          const participantData = {
            uuid: eventData.data.uuid,
            display_name: eventData.data.display_name,
            role: eventData.data.role,
            is_muted: eventData.data.is_muted,
            is_video_muted: eventData.data.is_video_muted,
            is_presenting: false // Default to false on connect
          };
          sseData = {
            eventType: eventType,
            conferenceAlias: conferenceAlias,
            destinationAlias: destinationAlias,
            participant: participantData,
            timestamp: new Date().toISOString()
          };

          // Ensure conference exists and update its destinationAlias if it's the first one
          // The upsertConference function will handle inserting if not exists, and updating destinationAlias
          upsertConference(conferenceAlias, conferenceName || conferenceAlias, true, false, destinationAlias); // Pass destinationAlias here

          // Insert participant into SQLite
          const insertPartStmt = db.prepare(`
            INSERT OR IGNORE INTO participants (uuid, conferenceAlias, display_name, role, is_muted, is_video_muted, is_presenting)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          const insPartResult = insertPartStmt.run(
            participantData.uuid,
            conferenceAlias,
            participantData.display_name,
            participantData.role,
            participantData.is_muted ? 1 : 0,
            participantData.is_video_muted ? 1 : 0,
            participantData.is_presenting ? 1 : 0
          );
          console.log(`SQLite: Participant '${participantData.display_name}' connected to '${conferenceAlias}'. Changes: ${insPartResult.changes}`);
        } else {
          console.log(`Ignoring participant_connected event without conference context or data.`);
        }
        break;

      case 'participant_updated':
        if (conferenceAlias && eventData.data) {
          const participantData = {
            uuid: eventData.data.uuid,
            display_name: eventData.data.display_name,
            role: eventData.data.role,
            is_muted: eventData.data.is_muted,
            is_video_muted: eventData.data.is_video_muted,
            is_presenting: eventData.data.is_presenting,
          };
          sseData = {
            eventType: eventType,
            conferenceAlias: conferenceAlias,
            participant: participantData,
            timestamp: new Date().toISOString()
          };
          // Update participant in SQLite
          const updatePartStmt = db.prepare(`
            UPDATE participants
            SET display_name = ?, role = ?, is_muted = ?, is_video_muted = ?, is_presenting = ?
            WHERE uuid = ? AND conferenceAlias = ?
          `);
          const updPartResult = updatePartStmt.run(
            participantData.display_name,
            participantData.role,
            participantData.is_muted ? 1 : 0,
            participantData.is_video_muted ? 1 : 0,
            participantData.is_presenting ? 1 : 0,
            participantData.uuid,
            conferenceAlias
          );
          console.log(`SQLite: Participant '${participantData.display_name}' updated in '${conferenceAlias}'. Changes: ${updPartResult.changes}`);
        } else {
          console.log(`Ignoring participant_updated event without conference context or data.`);
        }
        break;

      case 'participant_disconnected':
        if (conferenceAlias && eventData.data) {
          const participantUuid = eventData.data.uuid;
          sseData = {
            eventType: eventType,
            conferenceAlias: conferenceAlias,
            participant: { uuid: participantUuid },
            timestamp: new Date().toISOString()
          };
          // Remove participant from SQLite
          const deletePartStmt = db.prepare('DELETE FROM participants WHERE uuid = ? AND conferenceAlias = ?');
          const delPartResult = deletePartStmt.run(participantUuid, conferenceAlias);
          console.log(`SQLite: Participant '${participantUuid}' disconnected from '${conferenceAlias}'. Changes: ${delPartResult.changes}`);
        } else {
          console.log(`Ignoring participant_disconnected event without conference context or data.`);
        }
        break;

      default:
        console.log(`Ignoring unhandled event type: ${eventType}`);
        break;
    }

    if (sseData) {
      console.log('Publishing to Redis (sseData):', JSON.stringify(sseData, null, 2));
      publisher.publish(REDIS_CHANNEL, JSON.stringify(sseData));
      console.log(`Published event to Redis channel '${REDIS_CHANNEL}': ${eventType}`);
      res.status(200).json({ status: 'success', message: 'Event received and published to Redis' });
    } else {
      res.status(200).json({ status: 'ignored', message: `Event type '${eventType}' not handled or missing context` });
    }
  } catch (error) {
    console.error(`Error processing event type ${eventType} with SQLite:`, error);
    res.status(500).json({ status: 'error', message: `Failed to process event: ${error.message}` });
  }
});

// --- SSE Broadcaster Endpoint ---
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering for SSE

  console.log('New SSE client connected.');
  res.write('event: connected\ndata: {"message": "Connected to SSE stream"}\n\n');

  subscriber.subscribe(REDIS_CHANNEL, (err, count) => {
    if (err) {
      console.error('Failed to subscribe to Redis channel:', err);
      return res.end();
    }
    console.log(`Subscribed to ${count} channel(s).`);
  });

  subscriber.on('message', (channel, message) => {
    if (channel === REDIS_CHANNEL) {
      try {
        const event = JSON.parse(message);
        res.write(`event: ${event.eventType}\ndata: ${JSON.stringify(event)}\n\n`);
      } catch (e) {
        console.error('Error parsing Redis message:', e);
      }
    }
  });

  req.on('close', () => {
    console.log('SSE client disconnected.');
    subscriber.unsubscribe(REDIS_CHANNEL);
    res.end();
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
  console.log(`Redis URL: ${REDIS_URL}`);
});

publisher.on('error', (err) => console.error('Redis Publisher Error:', err));
subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
