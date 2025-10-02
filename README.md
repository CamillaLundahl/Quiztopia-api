# Quiztopia API

En serverless API för att skapa och hantera quiz med geografiska frågor.

## Arkitektur

### Teknisk Stack
- **Serverless Framework** - För deployment och infrastruktur
- **AWS Lambda** - Serverless funktioner
- **AWS DynamoDB** - NoSQL databas
- **AWS API Gateway** - REST API endpoints
- **Node.js** - Runtime
- **JWT** - Autentisering
- Bcrypt - Lösenordshashing
- Middy - Lambda middleware

### Lambda Funktioner
- `register` - Registrera ny användare
- `login` - Logga in användare
- `getAllQuizzes` - Hämta alla quiz
- `createQuiz` - Skapa nytt quiz (kräver auth)
- `getQuizById` - Hämta specifikt quiz med frågor
- `deleteQuiz` - Ta bort quiz (kräver auth)
- `addQuestion` - Lägg till fråga till quiz (kräver auth)

## Installation

- git clone https://github.com/CamillaLundahl/Quiztopia-api.git
- npm install
- npm install -g serverless
- aws configure
- serverless deploy

## 🎬 Postman Collection

### Snabb start:

1. **Ladda ner** `quiztopia-postman-collection.json` från detta repo
2. **Öppna Postman**
3. **Klicka "Import"** 
4. **Dra och släpp** eller välj filen `quiztopia-postman-collection.json`
5. **Uppdatera baseUrl** variabel:
   - Klicka på "Quiztopia API" collection
   - Gå till "Variables" tab
   - Ändra `baseUrl` till din AWS API Gateway URL

### Testordning:

1. **Register User** - Skapa ett testkonto
2. **Login User** - Logga in (JWT token sparas automatiskt)
3. **Create Quiz** - Skapa ett nytt quiz
4. **Add Question to Quiz** - Lägg till frågor
5. **Get All Quizzes** - Se alla tillgängliga quiz
6. **Get Specific Quiz** - Hämta quiz med alla frågor
7. **Delete Quiz** - Ta bort ditt quiz
