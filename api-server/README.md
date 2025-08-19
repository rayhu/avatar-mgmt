# API Server Configuration

## Azure TTS Configuration

To use Azure TTS through the backend API, you need to configure the following
environment variables:

### Required Environment Variables

Create a `.env` file in the `api-server` directory with the following variables:

```env
# Azure Speech Service Configuration
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=eastasia

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=directus
DB_USER=directus
DB_PASSWORD=directus

# Directus Configuration
DIRECTUS_URL=http://localhost:8055
DIRECTUS_TOKEN=your_directus_token_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Azure Speech Service Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a Speech Service resource
3. Get your subscription key and region
4. Add them to the `.env` file

### API Endpoints

- `POST /api/azure-tts` - Azure TTS synthesis
  - Body: `{ ssml: string, voice?: string }`
  - Returns: audio/mpeg binary data

- `POST /api/openai-ssml` - OpenAI SSML generation
  - Body: `{ text: string, voice?: string }`
  - Returns: `{ ssml: string }`

- `GET /api/avatars` - Get avatar models
  - Returns: `Avatar[]`

## Security Benefits

By using the backend API:

1. **Azure keys are not exposed** to the frontend
2. **Better security** - sensitive credentials stay on the server
3. **Rate limiting** can be implemented on the backend
4. **Caching** can be implemented for better performance
5. **Logging** and monitoring can be centralized

## Frontend Configuration

The frontend will automatically use the backend API when `VITE_AZURE_SPEECH_KEY`
is not set in the frontend environment.

To force frontend mode (not recommended for production):

```env
VITE_AZURE_SPEECH_KEY=your_key_here
```
