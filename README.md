Legal Case Management System (LCMS)
1. Project Setup Instructions ⚙️
Prerequisites

Node.js (>=18.x)

npm (>=9.x)

MongoDB Atlas or local MongoDB instance

Git

Steps

Clone the repository

1. git clone https://github.com/<your-username>/LCMS.git
cd LCMS
2. Install dependencies
npm install


3. Configure environment variables
Create a .env file in the root directory:

PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key


4. Start the server

npm start


or for development:

npm run dev

2. Public URL 🌐

Your project is deployed and accessible at:

👉 http://<13.239.183.121>:5001

3. Test Credentials 

To access the admin dashboard, use the following credentials:

Username: 1109912480@qq.com

Password: 12345678


