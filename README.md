# Arc-Notify

Discord bot to notify players of Arc Raiders events, manage event-specific roles, and provide self-assign reaction-role embeds.

---

## Features

1. **Event Announcements**
   - Polls Metaforge API for upcoming events.
   - Sends **embedded messages** in a Discord channel.
   - Includes **role pings** for events.
   - Sends currently running events immediately on startup.

2. **Event Role Management**
   - Automatically creates roles for events if missing.
   - Stores roles in `roles.json` for persistence.
   - Updates role IDs if roles are deleted and recreated.
   - Role names, emojis, and optional icons are configurable.

3. **Reaction-Role Channel**
   - Optional second channel where an **embed lists all roles**.
   - Users can **react to get/remove roles**.
   - Emojis and icons from `roles.json` are displayed.
   - Automatically updates when new roles are added.

4. **Slash Commands**
   - `/next-event` shows the next upcoming event with time and map.
   - Commands are registered per guild using `GUILD_ID`.
   - Works instantly (guild commands).

5. **Polling**
   - Default polling interval: 60 seconds.
   - Configurable via `.env` with `FETCH_INTERVAL`.
   - Ensures users are notified immediately when an event starts.

6. **Docker Support**
   - Prebuilt Dockerfile for Node 20.
   - Docker Compose for easy deployment.
   - Persistent `roles.json` via volume mapping.
   - Automatic restart on crashes or container restarts.

---

## Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/arc-notify.git
   cd arc-notify
