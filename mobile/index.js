import { registerRootComponent } from 'expo';
import App from './App';

// Ponto de entrada do app. Usar um index.js local (em vez de apontar o "main"
// para dentro de node_modules) é o padrão recomendado do Expo e evita o erro
// "Cannot resolve entry file" em alguns ambientes (ex.: Windows).
registerRootComponent(App);
