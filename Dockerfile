# Usa imagem oficial do Node
FROM node:20-alpine

# Diretório dentro do container
WORKDIR /app

# Copia package.json primeiro (melhora cache de build)
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o resto do projeto
COPY . .

# Gera Prisma Client
RUN npx prisma generate

# Expõe porta
EXPOSE 3000

# Comando para iniciar aplicação
CMD ["npm", "run", "start:dev"]
