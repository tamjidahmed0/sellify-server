# Sellify Server — REST API

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

The backend server for **Sellify**, a full-stack e-commerce platform. Built with NestJS, PostgreSQL, and Prisma ORM.

---

## Features

-  **JWT Authentication** — Secure register & login
-  **Product CRUD** — Create, update, delete, and fetch products
-  **Cart System** — Add, remove, and manage cart items
-  **Order Management** — Place and track orders
-  **Reviews & Ratings** — Product reviews by verified buyers
-  **Stripe Payment** — Secure payment processing
-  **Cloudinary Upload** — Product image uploads
-  **Admin Routes** — Manage products and orders *(in progress)*

---

##  Tech Stack

| Technology | Purpose |
|------------|---------|
| [NestJS](https://nestjs.com/) | Backend framework |
| [PostgreSQL](https://www.postgresql.org/) | Relational database |
| [Prisma ORM](https://www.prisma.io/) | Database ORM |
| [Cloudinary](https://cloudinary.com/) | Image storage |
| [Stripe](https://stripe.com/) | Payment processing |
| [JWT](https://jwt.io/) | Authentication |
| [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Password hashing |

---

##  Getting Started

### Prerequisites

- Node.js `v18+`
- PostgreSQL database
- Cloudinary account
- Stripe account

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/tamjidahmed0/sellify-server.git
cd sellify-server
```

**2. Install dependencies**
```bash
npm install
```

**3. Setup environment variables**

Create a `.env` file in the root:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sellify

JWT_SECRET=your_jwt_secret
ADMIN_JWT_SECRET= your_admin_jwt

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

**4. Run Prisma migrations**
```bash
npx prisma migrate dev
npx prisma generate
```

**5. Start the server**
```bash
# Development
npm run start:dev

# Production
npm run build
node dist/main
```

Server will run on `http://localhost:4000`


## 🔗 Related Repository

- **Frontend (Next.js):** [sellify](https://github.com/tamjidahmed0/sellify)



## Author

**Md Tamjid Ahammed**
- 💼 LinkedIn: [Md Tamjid Ahammed](https://linkedin.com/in/tamjidahmedofficial)
- 📧 Email: tamjidahmed050@gmail.com