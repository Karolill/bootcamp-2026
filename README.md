# Tillatelsesregister

Norwegian permit register application based on paragraph 6, built with React + Node.js.

## Prerequisites
- Node.js >= 18
- npm >= 9

## Getting started

### Backend
```bash
cd backend
npm install
npm start
```
Backend runs on http://localhost:3001

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173

## API Reference

### List all tillatelser
GET /api/tillatelser
GET /api/tillatelser?search=Hansen

### Create new
POST /api/tillatelser
Content-Type: multipart/form-data
Fields: personnummer, navn, kommunekode, løpenummer, fødselsår, kjønn, fra, til, type, stjåletEllerMistet, foto (file)

### Get one
GET /api/tillatelser/:id

### Update
PUT /api/tillatelser/:id
Content-Type: multipart/form-data

### Delete
DELETE /api/tillatelser/:id

### Import CSV/Excel
POST /api/import
Content-Type: multipart/form-data
Field: file (.csv or .xlsx)

### Get photo
GET /api/tillatelser/:id/foto

## CSV/Excel Import Format

The file must have these column headers:
personnummer,navn,kommunekode,løpenummer,fødselsår,kjønn,fra,til,type,stjåletEllerMistet

Example:
```
personnummer,navn,kommunekode,løpenummer,fødselsår,kjønn,fra,til,type,stjåletEllerMistet
12345678901,Ola Nordmann,0301,001,1985,M,2024-01-01,2029-01-01,fører,false
```
