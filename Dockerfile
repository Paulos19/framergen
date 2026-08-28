# ========================================================
# Dockerfile - Media Studio Suite (VPS / Easypanel Ready)
# ========================================================

FROM node:20-bookworm-slim

# Instalação do FFmpeg, bibliotecas gráficas nativas e fontes
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libvips-dev \
    fonts-liberation \
    fontconfig \
    ca-certificates \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Diretório de trabalho da aplicação
WORKDIR /app

# Copia os manifestos de pacotes
COPY package*.json ./

# Instala as dependências de produção
RUN npm install --omit=dev

# Copia todo o código-fonte
COPY . .

# Cria os diretórios necessários para armazenamento temporário
RUN mkdir -p storage/uploads storage/frames storage/bg-output storage/pdf-output storage/tmp

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Expõe a porta do servidor web
EXPOSE 3000

# Healthcheck para monitoramento no Docker/Easypanel
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicialização
CMD ["node", "server.js"]
