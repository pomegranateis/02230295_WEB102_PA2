# Pokémon API Project Report

## Overview

This project implements a Pokémon API using the Hono framework with Node.js, Prisma for database interactions, JWT for authentication, and bcrypt for password hashing. The API supports user registration, login, fetching Pokémon data from an external API, and managing caught Pokémon for authenticated users.

## Technologies Used

- **Hono**: A minimalist web framework for building APIs.
- **Prisma**: An ORM for database interactions.
- **JWT (Json Web Token)**: For securing routes and user authentication.
- **bcrypt**: For hashing passwords securely.
- **axios**: For making HTTP requests to external APIs.

## API Endpoints

### Public Endpoints

1. **Register**
   - **URL**: `/register`
   - **Method**: `POST`
   - **Description**: Registers a new user.
   - **Request Body**:
     ```json
     {
       "email": "test@example.com",
       "password": "yourPassword"
     }
     ```
   - **Responses**:
     - `200`: User created successfully.
     - `400`: Email already exists.
     - `500`: Internal Server Error.

2. **Login**
   - **URL**: `/login`
   - **Method**: `POST`
   - **Description**: Authenticates a user and returns a JWT token.
   - **Request Body**:
     ```json
     {
       "email": "test@example.com",
       "password": "yourPassword"
     }
     ```
   - **Responses**:
     - `200`: Login successful, returns JWT token.
     - `404`: User not found.
     - `401`: Invalid credentials.
     - `500`: Internal Server Error.

3. **Fetch Pokémon Data**
   - **URL**: `/pokemon/:name`
   - **Method**: `GET`
   - **Description**: Fetches data for a specified Pokémon from an external API.
   - **Parameters**: `name` - The name of the Pokémon.
   - **Responses**:
     - `200`: Returns Pokémon data.
     - `404`: Pokémon not found.
     - `500`: Error fetching Pokémon data or unexpected error.

### Protected Endpoints

These endpoints require an `Authorization` header with a valid JWT token.

1. **Catch Pokémon**
   - **URL**: `/protected/catch`
   - **Method**: `POST`
   - **Description**: Records a Pokémon as caught by the authenticated user.
   - **Headers**:
     ```plaintext
     Authorization: Bearer <your_jwt_token>
     ```
   - **Request Body**:
     ```json
     {
       "name": "pikachu"
     }
     ```
   - **Responses**:
     - `200`: Pokémon caught.
     - `400`: Pokémon name is required.
     - `401`: Unauthorized.
     - `500`: Internal Server Error.

2. **Release Pokémon**
   - **URL**: `/protected/release/:id`
   - **Method**: `DELETE`
   - **Description**: Releases a caught Pokémon for the authenticated user.
   - **Headers**:
     ```plaintext
     Authorization: Bearer <your_jwt_token>
     ```
   - **Parameters**: `id` - The ID of the caught Pokémon.
   - **Responses**:
     - `200`: Pokémon is released.
     - `404`: Pokémon not found or not owned by user.
     - `401`: Unauthorized.
     - `500`: Internal Server Error.

3. **List Caught Pokémon**
   - **URL**: `/protected/caught`
   - **Method**: `GET`
   - **Description**: Lists all Pokémon caught by the authenticated user.
   - **Headers**:
     ```plaintext
     Authorization: Bearer <your_jwt_token>
     ```
   - **Responses**:
     - `200`: Returns list of caught Pokémon.
     - `401`: Unauthorized.
     - `500`: Internal Server Error.

## Environment Variables

- `PORT`: The port on which the server runs (default: `3001`).
- `DATABASE_URL`: The database connection string for Prisma.

## Setup and Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   
2. **Install dependencies**

   ```bash
   npm install

3. Setup Prisma
* Create a prisma/schema.prisma file with the following content:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id             Int      @id @default(autoincrement())
  email          String   @unique
  hashedPassword String
}

model Pokemon {
  id   Int    @id @default(autoincrement())
  name String @unique
}

model CaughtPokemon {
  id        Int     @id @default(autoincrement())
  userId    Int
  pokemonId Int
  user      User    @relation(fields: [userId], references: [id])
  pokemon   Pokemon @relation(fields: [pokemonId], references: [id])
}
```
* Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

4. Run the server:
```bash
npm start
```

5. Server should be running on:

```plaintext
http://localhost:3001
```

## Testing with Postman

1. Register User:

* URL: '**http://localhost:3001/register**'
* Method: '**POST**'
* Body:
```json
{
  "email": "test@example.com",
  "password": "yourPassword"
}
```
2. Login User:

* URL: '**http://localhost:3001/login**'
* Method: '**POST**'
* Body:
```json
{
  "email": "test@example.com",
  "password": "yourPassword"
}
```
3. Catch Pokémon:
* URL: '**http://localhost:3001/protected/catch**'
* Method: '**POST**'
* Headers:
```plaintext
Authorization: Bearer <your_jwt_token>
```
* Body:
```json
{
  "name": "pikachu"
}
```

***This `report.md` file provides an overview of the project, details on the API endpoints, environment variables, setup instructions, and how to test the API using Postman.***
