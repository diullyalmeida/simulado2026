import { useState } from 'react'
import { dadosClima } from './dadosClima'
import { codigosWmo } from './codigosWmo'
import './App.css'

function App() {
  const [busca, setBusca] = useState('')
  const [cidade, setCidade] = useState(null)
  const [clima, setClima] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function buscar(nome) {
    const texto = nome || busca
    if (!texto) {
      setErro('Digite uma cidade')
      return
    }

    setBusca(texto)
    setCarregando(true)
    setErro('')

    try {
      const r1 = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${texto}&count=1&language=pt`)
      const d1 = await r1.json()

      if (!d1.results) {
        setErro('Cidade não encontrada')
        setCarregando(false)
        return
      }

      const loc = d1.results[0]
      setCidade(loc)

      const r2 = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto&forecast_days=10`)
      const d2 = await r2.json()
      setClima(d2)
    } catch {
      setErro('Erro ao buscar dados')
    }

    setCarregando(false)
  }

  function pegarInfo(cod) {
    return codigosWmo[cod] || { descricao: 'Desconhecido', icone: 'sol.svg' }
  }

  function formatarDia(data, i) {
    const [ano, mes, dia] = data.split('-')
    const sem = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    const nome = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : sem[new Date(ano, mes - 1, dia).getDay()]
    return `${nome} - ${dia}/${mes}`
  }

  return (
    <div className="app">
      <div className="primeira">
        <img src="./solchuva.svg" alt="" />
        <div className="coluna">
          <h1>Sol Chuva</h1>
          <p>O tempo certo, onde você estiver.</p>
        </div>
      </div>

      <div className="busca">
        <input
          list="cidades"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Digite o nome de uma cidade..."
        />
        <datalist id="cidades">
          {dadosClima.map((c, i) => <option key={i} value={c.name} />)}
        </datalist>
        <button className="btn" onClick={() => buscar()}>Buscar</button>
      </div>

      <div className="chips">
        {dadosClima.map((c, i) => (
          <button key={i} onClick={() => buscar(c.name)}>{c.name}</button>
        ))}
      </div>

      {carregando && <p>Carregando dados do clima...</p>}
      {erro && <p className="erro">{erro}</p>}

      {cidade && clima && !carregando && (
        <div className="atual">
          <h2>{cidade.name} - {cidade.admin1}, {cidade.country}</h2>

          <div className="principal">
            <img src={`./icones/${pegarInfo(clima.current.weather_code).icone}`} alt="" />
            <div>
              <h1>{clima.current.temperature_2m} °C</h1>
              <p>{pegarInfo(clima.current.weather_code).descricao}</p>
            </div>
          </div>

          <div className="grade-info">
            <p>Sensação: <b>{clima.current.apparent_temperature} °C</b></p>
            <p>Umidade: <b>{clima.current.relative_humidity_2m}%</b></p>
            <p>Vento: <b>{clima.current.wind_speed_10m} km/h</b></p>
            <p>Precipitação: <b>{clima.current.precipitation} mm</b></p>
            <p>Índice UV: <b>{clima.daily.uv_index_max[0]}</b></p>
            <p>Nascer/Pôr do sol: <b>{clima.daily.sunrise[0].slice(11)} / {clima.daily.sunset[0].slice(11)}</b></p>
          </div>
        </div>
      )}

      {clima && !carregando && (
        <div className="dias">
          {clima.daily.time.map((data, i) => (
            <div key={i} className="dia">
              <b>{formatarDia(data, i)}</b>
              <img src={`./icones/${pegarInfo(clima.daily.weather_code[i]).icone}`} alt="" />
              <p>{pegarInfo(clima.daily.weather_code[i]).descricao}</p>
              <p><b>{clima.daily.temperature_2m_max[i]}°</b> / {clima.daily.temperature_2m_min[i]}°</p>
              <p>Chuva: {clima.daily.precipitation_probability_max[i]}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App