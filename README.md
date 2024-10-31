# Crypto-Balance-System

The system will allow users to manage their crypto holdings and view current valuations built with NestJS.

## Architecture
### ** *Please click on the picture and open the document tab for the approach explanation* **
<a href="https://app.eraser.io/workspace/nCeo9GJ8W4I2jVVdPZst?elements=PsIDxAlSMNf4pEHxKFnT9Q">View on Eraser<br /><img src="https://app.eraser.io/workspace/nCeo9GJ8W4I2jVVdPZst/preview?elements=PsIDxAlSMNf4pEHxKFnT9Q&type=embed" width=750 height=450/></a>

## Project setup

***NOTE: Make sure to have .env files in every app\'s root folder ("apps/\*") with keys like in .env.example to make it send requests successfully***

### Compile and run the project locally - MANUAL
- In the microservices main.ts files and modules where hosts are provided, change to localhost instead of the current Docker services names.
- Host Postgre databases for every microservice that connects to Postgres DB and update .env file DB_NAME to be the name of the db you create. 

```bash
# install dependencies
$ npm install

# Start gateway
$ npm start api-gateway

# Start Microservices
$ npm start balance
$ npm start rate
$ npm start user

# Run tests
$ npm test
```

### Compile and run the project at once in Docker environment (RECOMMENDED)
- Make sure Docker and docker-compose are installed in your machine
- Run Docker engine
- For every service that has a DB secret, add a ```password.txt``` file in apps/*/db (e.g. for user service: apps/user/db/password.txt)
- Run the following command:
```bash
$ docker compose up --build
```
*NOTE: You should run tests maunally with ```npm test``` for now*

## Documentation
Once the application is running (either ways) you can visit http://localhost:3000/api to see the Swagger interactive interface and docs.
