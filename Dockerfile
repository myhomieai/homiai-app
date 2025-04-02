# ---------- שלב הבנייה ----------
    FROM node:20-alpine AS builder

    WORKDIR /app
    
    COPY package*.json ./
    RUN npm install
    
    COPY . .
    
    RUN npm run build
    
    # ---------- שלב ההרצה ----------
    FROM node:20-alpine AS runner
    
    WORKDIR /app
    
    COPY --from=builder /app ./
    
    ENV NODE_ENV=production
    ENV PORT=3000
    
    EXPOSE 3000
    
    CMD ["npm", "start"]