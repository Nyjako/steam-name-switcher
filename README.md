# Steam Quick Username Switcher

A simple Node.js web app to quickly switch between pre-defined Steam usernames using a web interface. The app logs into your Steam account, starts a local web server, and allows you to choose from a list of saved usernames (with category support) or add new ones.

---

## Features

- 🔐 Logs into your Steam account using username, password, and Steam Guard code
- 🌐 Runs a local web server at `http://localhost:3000`
- 🧠 Allows selecting usernames from a list
- ➕ Easily add new usernames
- 🏷️ Organize usernames using categories
- 📦 Built with:
    - Node.js
    - EJS (template engine)
    - Steam-related libraries by [DoctorMcKay](https://github.com/DoctorMcKay)

---

## Getting Started

### Prerequisites

- Node.js installed
- A Steam account

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/steam-username-switcher.git
    cd steam-username-switcher
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the app:

    ```bash
    node index.js
    ```

4. Open your browser and go to:

    ```
    http://localhost:3000
    ```

## Usage

1. Login

    Enter your Steam username, password, and Steam Guard code.

    > **Warning**
    > ⚠️ Steam Guard must be entered on the login screen. QR login and delayed Steam Guard entry are currently not supported.

2. Manage Usernames

Once logged in, you'll see a simple interface where you can:

    - Select a username to switch to
    - Add new usernames
    - Assign categories to usernames for better organization

## Notes

- This tool is intended for local use only.
- Your Steam credentials are not stored anywhere
- Only one Steam session is active at a time — restarting app will invalidate previous sessions.

## Disclaimer

This tool is unofficial and not affiliated with Valve or Steam in any way. Use at your own risk. Always be cautious with apps that interact with your Steam account.