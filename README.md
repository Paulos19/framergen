# ⚡ MEDIA STUDIO SUITE

> Suíte profissional web em **Node.js**, **Tailwind CSS** e **Docker** contendo **Extrator de Frames a 24 FPS (otimizado para vídeos de 8s)**, **Removedor de Fundo Perfeito com IA (refinamento em 4 fases)** e **Digitalizador de Imagens para PDF (Document Scanner)**.

---

## 🌟 Funcionalidades Principais

### 1. 🎬 Extrator de Frames 24 FPS (Vídeos de 8 Segundos)
- **Taxa de quadros precisa:** Configurado nativamente para 24 fps (vídeos de 8s geram exatamente 192 frames).
- **Extração ultrarrápida com FFmpeg:** Processamento multi-thread com monitoramento de progresso e velocidade em tempo real.
- **Player Interativo & Scrubber:** Visualizador estilo flipbook para reproduzir a sequência de frames em loop contínuo (0.5x, 1.0x, 2.0x) ou navegar frame a frame com slider de precisão.
- **Download Flexível:** Baixe frames individuais, baixe todos em arquivo `.ZIP` ou apenas os selecionados.
- **Pipeline Integrado:** Envie qualquer frame diretamente para o Removedor de Fundo ou para o Scanner de PDF com 1 clique.
- **Botão de Teste Rápido:** Gera um vídeo sintético de 8s (192 frames) para testes instantâneos.

### 2. ✨ Removedor de Fundo Perfeito com IA
- **Inteligência Artificial Nativa:** Segmentação precisa com `@imgly/background-removal-node`.
- **Pipeline de Refinamento Alpha em 4 Fases:**
  1. *Gradiente Suave*: preserva fios de cabelo finos e bordas semi-transparentes.
  2. *Suavização Local*: elimina serrilhados e efeito escadinha (*anti-aliasing*).
  3. *Fechamento Morfológico*: preenche micro-buracos internos no sujeito.
  4. *Recuperação de Sujeitos Claros*: evita remoção acidental de roupas brancas, capuzes ou tons claros.
- **Split Viewer (Antes/Depois):** Comparador interativo com divisor arrastável.
- **Fundo Customizável:** Transparente (xadrez) ou paleta de cores sólidas e seletor HEX.
- **Exportação:** Download em PNG de alta definição com canal alfa ou envio para o gerador de PDF.

### 3. 📄 Digitalizador de Imagens para PDF (Document Scanner)
- **Criação de Documentos PDF:** Montagem multipáginas a partir de fotos, scans ou frames de vídeo.
- **Filtros Profissionais de Scanner (`sharp`):**
  - `Original`: Mantém a imagem original.
  - `✨ Magic Color`: Realce de saturação e contraste para documentos coloridos.
  - `📄 Clean B&W`: Alto contraste limpo (estilo fotocopiadora/scanner de escritório).
  - `⚖️ Grayscale`: Escala de cinza balanceada.
  - `🔍 Nitidez`: Aumento de clareza para textos desfocados.
- **Organização Drag-and-Drop (`SortableJS`):** Reordene a sequência das páginas arrastando os cards.
- **Ajustes Individuais:** Rotação de 90° por página, exclusão e visualização ampliada.
- **Configurações do PDF (`pdf-lib`):** Formato (A4, Carta, Auto-Fit), Orientação (Retrato, Paisagem, Automático) e Margens configuráveis.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js (ES Modules), Express, Fluent-FFmpeg, Sharp, Jimp, @imgly/background-removal-node, pdf-lib, Archiver, Multer.
- **Frontend:** HTML5 semântico, Tailwind CSS, Lucide Icons, SortableJS, Vanilla JS modular (sem frameworks pesados).
- **Infraestrutura:** Docker, Docker Compose, Debian Bookworm Slim, FFmpeg.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+ ou 20+
- FFmpeg instalado no sistema (adicione ao PATH do sistema)

### Passo a Passo
```bash
# 1. Entre na pasta do projeto
cd media-studio

# 2. Instale as dependências
npm install

# 3. Inicie o servidor em modo de desenvolvimento
npm run dev

# 4. Acesse no navegador:
http://localhost:3000
```

---

## 🐳 Como Executar com Docker / Docker Compose

O projeto já possui `Dockerfile` e `docker-compose.yml` prontos com todas as bibliotecas nativas e o FFmpeg pré-instalados.

```bash
# Construir e iniciar o container
docker compose up -d --build

# Ver logs do container
docker compose logs -f

# Acessar a aplicação
http://localhost:3000
```

---

## 🌐 Deploy na VPS usando Easypanel + GitHub

O **Easypanel** permite hospedar este projeto facilmente na sua VPS via GitHub em menos de 2 minutos:

### Passo 1: Subir o Projeto para o GitHub
1. Crie um repositório no seu GitHub (ex: `media-studio-suite`).
2. Faça o push dos arquivos do diretório `media-studio` para a raiz do seu repositório GitHub:
   ```bash
   cd media-studio
   git init
   git add .
   git commit -m "feat: initial commit media-studio-suite"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

### Passo 2: Criar o Serviço no Easypanel
1. No painel do **Easypanel** na sua VPS, entre no seu projeto.
2. Clique no botão **`+ Service`** e selecione o tipo **`App`**.
3. Defina o nome do serviço (ex: `media-studio`).
4. Na aba **Source** (Fonte):
   - Escolha **GitHub**.
   - Conecte sua conta do GitHub e selecione o repositório `media-studio-suite`.
   - Selecione a branch `main`.
5. Na aba **Build**:
   - Tipo de Build: **Dockerfile**.
   - Dockerfile Path: `./Dockerfile` (ou `Dockerfile`).
6. Na aba **Environment** (Ambiente):
   - Adicione a variável `PORT=3000`.
   - Adicione `NODE_ENV=production`.
7. Na aba **Domains** (Domínios):
   - Adicione seu domínio ou subdomínio (ex: `studio.seudominio.com`).
   - O Easypanel configurará automaticamente o certificado SSL (HTTPS) gratuito via Let's Encrypt.
8. Clique no botão **`Deploy`** no canto superior direito.

### Passo 3: Pronto!
O Easypanel fará o clone do GitHub, executará o build do Docker com o FFmpeg e o Node.js, e iniciará o Media Studio automaticamente com reinício automático garantido caso a VPS reinicie.

---

## 📂 Estrutura do Projeto

```
media-studio/
├── public/
│   ├── css/
│   │   └── style.css            # Estilos customizados e animações
│   ├── js/
│   │   ├── app.js               # Orquestrador principal
│   │   ├── extractor.js         # Lógica do extrator e player de frames
│   │   ├── bgRemover.js         # Removedor IA e slider comparador
│   │   ├── scanner.js           # Digitalizador de imagens e PDF
│   │   └── ui.js                # Toasts, abas e utilitários de UI
│   └── index.html               # Interface Web completa
├── src/
│   ├── routes/
│   │   ├── extractRoutes.js     # Endpoints de vídeo e frames
│   │   ├── bgRoutes.js          # Endpoints de IA e remoção de fundo
│   │   ├── scannerRoutes.js     # Endpoints de filtros e PDF
│   │   └── zipRoutes.js         # Endpoints de compactação ZIP
│   ├── services/
│   │   ├── ffmpegService.js     # Extração de frames com FFmpeg
│   │   ├── bgRemovalService.js  # IA e refinamento em 4 fases
│   │   ├── scannerService.js    # Filtros com Sharp
│   │   └── pdfService.js        # Geração de PDF com pdf-lib
│   └── utils/
│       └── fileCleanup.js       # Limpeza automática de temporários
├── Dockerfile                   # Build de produção otimizado
├── docker-compose.yml           # Orquestração de container
├── package.json                 # Dependências do projeto
├── server.js                    # Servidor Express principal
└── README.md                    # Documentação do projeto
```

---

## 📄 Licença
Distribuído sob a licença MIT. Sinta-se livre para usar e modificar.
