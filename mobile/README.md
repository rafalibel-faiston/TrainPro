# TrainPro Mobile

App mobile do TrainPro em Expo / React Native. Consome a mesma API do backend.

## Rodar

```bash
cd mobile
npm install
npm start          # abre o Expo Dev Tools (escaneie o QR com o app Expo Go)
```

## Configurar a API

O endereço da API fica em `app.json` → `expo.extra.apiUrl`. Em desenvolvimento:

- **Emulador Android:** `http://10.0.2.2:4000`
- **iOS Simulator:** `http://localhost:4000`
- **Dispositivo físico:** `http://<IP-da-sua-máquina>:4000`

> Esta é uma base inicial (login + listagem de treinos). As telas de evolução,
> agenda e pagamentos seguem o mesmo padrão do app web e podem ser adicionadas
> reutilizando o cliente em `src/api.ts`.
