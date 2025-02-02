# Assignment-1

## Database Tables and Columns

### 1. User Table
- firstName
- lastName
- email
- age
- contactNumber
- password
- reviews

### 2. Product Table
- name
- price
- description
- category
- sellerId

### 3. Cart Table
- userId
- productId
- quantity

### 4. Order Table
- userId
- productId
- sellerId
- quantity
- otp
- isDelivered
- orderDate

## How to Run

1. Go to the `frontend` folder:
   - Run the command: `npm start`
   - After that, run the command: `npm run build`

2. Go to the `backend` folder:
   - Run the command: `npm start`
   - After that, run the command: `node server.js`