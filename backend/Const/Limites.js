const Limites = {
  zonafria: {
    dia: { bajo: 26, alto: 28 },
    noche: { bajo: 20, alto: 24 },
    diaam: { bajo: 26, alto: 28 }
  },
  zonacaliente: {
    dia: { bajo: 28, alto: 34 },
    noche: { bajo: 25, alto: 28 },
    diaam: { bajo: 28, alto: 34 }
  },
  humedad: {
    normal: { bajo: 30, alto: 50 },
    muda: { bajo: 50, alto: 70 }
  },
  uvi: {
    dia: { bajo: 0, alto: 0 }, 
    noche: { bajo: 0, alto: 0 },
    diaam: { bajo: 0.2, alto: 1 }
  }
};

module.exports = { Limites };