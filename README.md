
# APA - Autonomous Personal Agent (Local Setup)

This project is a high-level AI dashboard powered by Gemini 3 Pro and Gemini 2.5 Flash Native Audio. 

## 🚀 Local Deployment Instructions

1.  **Environment Setup**:
    Create a `.env` file in the root directory and paste your exact credentials:
    ```env
    # Required for Gemini AI (Must be named API_KEY)
   

    # Google Auth (Used for login)
    

    # Database Sync (Bridge Ready)
    
    ```

2.  **Install & Run**:
    ```bash
    npm install
    npx vite
    ```

3.  **Google Configuration**:
    - Go to your Google Cloud Console.
    - Under Credentials, ensure **Authorized JavaScript origins** includes `http://localhost:5173`.
    - Under **Authorized redirect URIs**, add `http://localhost:5173`.

## 🛡️ Core Architecture
- **Command Center**: Uses Gemini 3 Pro for complex task decomposition.
- **Voice Agent**: Uses Gemini 2.5 Flash for human-like telephony.
- **AutoPay**: Checks wallet balance before executing orders via tools.
- **Persistence**: Synced with local storage and prepared for MongoDB Atlas integration.
