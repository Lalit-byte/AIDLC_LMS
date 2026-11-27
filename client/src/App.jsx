import React from 'react';
import { Agentation } from 'agentation';
import AppRouter from './app/AppRouter';

export default function App() {
  return (
    <>
      <AppRouter />
      {import.meta.env.DEV && import.meta.env.MODE !== 'test' && (
        <Agentation endpoint="http://localhost:4747" />
      )}
    </>
  );
}
