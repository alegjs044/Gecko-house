export const LIMITES = {
  temperatura: {
    fria: {
      dia:    { min: 26, max: 28 },
      noche:  { min: 20, max: 24 },
      diaam:  { min: 26, max: 28 }
    },
    caliente: {
      dia:    { min: 28, max: 34 },
      noche:  { min: 25, max: 28 },
      diaam:  { min: 28, max: 34 }
    }
  },
  humedad: {
    normal: { min: 30, max: 50 },    // cuando NO está en muda
    muda:   { min: 50, max: 70 }     // cuando SÍ está en muda
  },
  luz_uv: {
    dia:    { min: 0,   max: 0 },
    noche:  { min: 0,   max: 0 },
    diaam:  { min: 0.2, max: 1 }
  }
};
