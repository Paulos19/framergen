# ========================================================
# Dockerfile - Media Studio Suite (Ultra Fast Build)
# ========================================================

FROM node:20-bookworm-slim

# Instalação rápida apenas do FFmpeg e dependências essenciais
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Diretório de trabalho da aplicação
WORKDIR /app

# Copia os manifestos de pacotes
COPY package*.json ./

# Instala as dependências de produção sem auditorias lentas
RUN npm install --omit=dev --no-audit --no-fund

# Copia todo o código-fonte da aplicação
COPY . .

# Cria os diretórios necessários para armazenamento temporário
RUN mkdir -p storage/uploads storage/frames storage/bg-output storage/pdf-output storage/tmp

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Expõe a porta do servidor web
EXPOSE 3000

# Healthcheck leve para Easypanel / Docker
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicialização
CMD ["node", "server.js"]
