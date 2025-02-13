# Robot Chat

## Overview

This app is a quick and dirty implementation of a signaling server, designed to facilitate the initial connection setup between peers in a WebRTC application.  
It should not be used for production environments and probably contains bugs and oversights.

## Purpose

The primary purpose of Robot Chat is to facilitate quick and efficient data exchange between servers. It is designed for scenarios where short-lived connections are sufficient, hence the limited durations of connections. This makes it ideal for applications that require rapid communication without the overhead of maintaining long-term connections.

## Features

- Create and join chat rooms
- Real-time messaging
- Room management
- Rate limiting

## Getting Started

### Prerequisites

- Node.js (>= 18)
- pnpm

### Installation

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd robot-chat
    ```

2. Install dependencies:
    ```sh
    pnpm install
    ```

### Building the Project

To build the project, run:
```sh
pnpm run build
```

### Running the Project

> Note that at first run, an admin API key will be generated that will allow the registration of other API keys. The key is hashed before being stored.

To start the project, run:
```sh
pnpm start
```

To start the project in watch mode, run:
```sh
pnpm run start:watch
```

### Development

To build the project in watch mode, run:
```sh
pnpm run build:watch
```

## Configuration

The app can be configured with the following environment variables:
| Environment Variable       | Description                                           | Default Value |
|----------------------------|-------------------------------------------------------|---------------|
| SSL_KEY                    | Path to the SSL key file                              | N/A           |
| SSL_CERT                   | Path to the SSL certificate file                      | N/A           |
| PORT                       | Port number on which the server will run              | 3000          |
| HOST                       | Hostname for the server                               | N/A           |
| LOBBY_TIMEOUT              | Timeout for the lobby in minutes                      | 10            |
| DEFAULT_ROOM_MAX_PEERS     | Maximum number of peers in a room                     | 10            |
| DEFAULT_ROOM_LIFETIME      | Lifetime of a room in minutes                         | 60            |
| API_KEYS_DB_PATH           | Path to the API keys database                         | N/A           |
| CORS_ORIGIN                | Comma-separated list of allowed CORS origins          | N/A           |

## License

This project is licensed under the MIT License.
