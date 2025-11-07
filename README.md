# India Quiz App - PostgreSQL Edition

## Setup

1. **Start Docker Desktop** (required)

2. **Start Database**:
```bash
docker-compose up -d
```

3. **Start Backend Server**:
```bash
npm run server
```

4. **Start Frontend** (in new terminal):
```bash
npm run dev
```

## Configuration

Database runs on `localhost:54321`
Backend API runs on `localhost:3001`
Frontend runs on `localhost:5173`

## Environment Variables

Edit `.env` file if needed. Default credentials work out of the box.

## Reset Database

```bash
docker-compose down -v
docker-compose up -d
```

