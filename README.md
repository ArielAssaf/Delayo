# Delayo Chrome Extension 💤

**Delay your tabs in style—and get back to them at the right time.**
Delayo is a Chrome extension that lets you "snooze tabs," hiding them temporarily and reopening them when you choose.
Ideal for those who want focus, organization and a tidier tab bar.

> 📌 This project is a *hard fork* of [Snoozr](https://github.com/hardchor/snoozr) with new ideas, its own identity
> and distinct plans for evolution.

---

## Releases and trust

- [Install Delayo from the Chrome Web Store](https://chromewebstore.google.com/detail/delayo/egbfkigkgocjmahcdmigccelneabbajh)
- The currently published store version is `1.2.0`; the next source release is `1.2.1`.
- Official builds are created by GitHub Actions from matching version tags such as `v1.2.1`.
- Each tagged release includes the exact ZIP uploaded to the Chrome Web Store and a SHA-256 checksum.
- Builds from other sources are unofficial; inspect the tag and checksum before installing one.

The `1.2.1` source is the next release after the current `1.2.0` store upload. Until `v1.2.1` is released, the repository should not be treated as a byte-for-byte copy of the installed store package.

### Permissions

Delayo requests only `storage`, `tabs`, `alarms`, `notifications`, and `contextMenus`:

- `storage` keeps delayed-tab records locally in Chrome.
- `tabs` reads the tab information needed to save and restore a delayed tab.
- `alarms` schedules wake-ups.
- `notifications` alerts you when a tab is ready.
- `contextMenus` adds the delay action to Chrome's tab context menu.

See the [privacy policy](docs/PRIVACY.md) and [API notes](docs/apis.md) for implementation details.

---

## 🚀 Features

- 💤 **Delay Tabs**: Temporarily snooze tabs so you can focus on what matters now
- ⏰ **Flexible Timing**: Choose from preset times (tonight, tomorrow, next week) or set a custom date/time
- 🔔 **Notifications**: Be alerted when tabs "wake up"
- 📋 **Delay Manager**: Manage all your snoozed tabs in one place
- 🌙 **Dark Mode**: Automatic dark theme based on your system settings

---

## 🧰 Tech Stack

| Technology       | Purpose                                          |
|------------------|--------------------------------------------------|
| **Vite**         | Fast development with hot reload                 |
| **TypeScript**   | Safe typing and coding productivity              |
| **React**        | Dynamic and responsive interfaces                |
| **CRX**          | Modern Chrome extension packaging                |
| **Tailwind CSS** | Agile and scalable styling                       |
| **DaisyUI**      | Elegant components with theme support            |

---

## 🛠 Requirements

- Node.js >=20
- pnpm >=8.15.0

---

## 📂 Project Structure

```
config/         # Build and tooling configurations
docs/           # Documentation and guides
public/
  html/         # Extension HTML entry points
  icons/        # Browser action icons
  _locales/     # i18n message files
src/
  assets/       # Fonts, images and global styles
  background/   # Background service worker
  components/   # Reusable React components
  pages/        # Options and popup React apps
  utils/        # Shared utilities
```

---

## 📦 How to Use

1. 📥 Install from the Chrome Web Store (or load unpacked via `chrome://extensions`)
2. 🖱️ Right-click a tab or use the extension icon
3. ⏱️ Choose when you want the tab to return
4. 💤 The tab will close and reopen automatically at the scheduled time

---

## 🧑‍💻 Development

To run locally:

```bash
# 1. Clone the repository
git clone https://github.com/ArielAssaf/Delayo.git
cd Delayo

# 2. Install dependencies
pnpm install

# 3. Start in development mode
pnpm dev

# 4. Build for production
pnpm build
```

## 📋 Contributing

We welcome contributions! Please read our [Contributing Guidelines](docs/CONTRIBUTING.md) to get started.

## 🔒 Privacy

Your privacy is important to us. Read our [Privacy Policy](docs/PRIVACY.md) to understand how Delayo handles your data.

## ⚖️ License

This project is licensed under the [MIT License](LICENSE).
Based on the [Snoozr](https://github.com/hardchor/snoozr) project with modifications and its own identity.

---

## 🇧🇷 Versão em Português

# Delayo Chrome Extension 💤

**Adie suas abas com estilo — e volte a elas no momento certo.**  
Delayo é uma extensão do Chrome que permite "colocar abas em espera", escondendo-as temporariamente e reabrindo-as no
momento que você escolher.  
Ideal para quem quer foco, organização e menos bagunça na barra de abas.

> 📌 Este projeto é um *hard fork* do [Snoozr](https://github.com/hardchor/snoozr), com novas ideias, identidade própria
> e planos de evolução distintos.

---

## 🚀 Features

- 💤 **Delay Tabs**: Adie abas temporariamente para focar no que importa agora
- ⏰ **Flexible Timing**: Escolha entre horários predefinidos (hoje à noite, amanhã, semana que vem) ou data/hora
  customizada
- 🔔 **Notifications**: Seja avisado quando as abas "acordarem"
- 📋 **Delay Manager**: Gerencie todas as abas adiadas em um só lugar
- 🌙 **Dark Mode**: Tema escuro automático com base no sistema

---

## 🧰 Tech Stack

| Tecnologia       | Função                                           |
|------------------|--------------------------------------------------|
| **Vite**         | Desenvolvimento rápido com hot reload            |
| **TypeScript**   | Tipagem segura e produtividade no código         |
| **React**        | Interfaces dinâmicas e responsivas               |
| **CRX**          | Empacotamento moderno de extensões para o Chrome |
| **Tailwind CSS** | Estilização ágil e escalável                     |
| **DaisyUI**      | Componentes elegantes com suporte a temas        |

---

## 🛠 Requisitos

- Node.js >=20
- pnpm >=8.15.0

---

## 📦 Como Usar

1. 📥 Instale a extensão pela Chrome Web Store (ou carregue não empacotada via `chrome://extensions`)
2. 🖱️ Clique com o botão direito em uma aba ou use o ícone da extensão
3. ⏱️ Escolha quando deseja que a aba retorne
4. 💤 A aba será fechada e reaberta automaticamente no horário escolhido

---

## 🧑‍💻 Desenvolvimento

Para rodar localmente:

```bash
# 1. Clone o repositório
git clone https://github.com/ArielAssaf/Delayo.git
cd Delayo

# 2. Instale dependências
pnpm install

# 3. Rode em modo de desenvolvimento
pnpm dev

# 4. Build para produção
pnpm build
```

## 📋 Como Contribuir

Contribuições são bem-vindas! Leia nosso [Guia de Contribuição](docs/CONTRIBUTING.md) para começar.

## 🔒 Privacidade

Sua privacidade é importante para nós. Leia nossa [Política de Privacidade](docs/PRIVACY.md) para entender como o Delayo trata seus dados.

## ⚖️ Licença

Este projeto está licenciado sob a [MIT License](LICENSE).  
Baseado no projeto [Snoozr](https://github.com/hardchor/snoozr), com modificações e identidade própria.
