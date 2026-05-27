'use client'
import { useEffect, useMemo, useState } from 'react'
import { groupsData } from '../data/groups.js'
import { supabase } from '../lib/supabase.js'
export default function Home() {

  const [username, setUsername] = useState('')
  const [savedUser, setSavedUser] = useState('')

  const [selectedGroup, setSelectedGroup] =
    useState<keyof typeof groupsData>(
      Object.keys(groupsData)[0] as keyof typeof groupsData
    )

  const [predictions, setPredictions] =
    useState<any[]>([])

  const [officialResults, setOfficialResults] =
    useState<any[]>([])

  useEffect(() => {

    const currentUser =
      localStorage.getItem('prodeUser')

    if (currentUser) {
      setSavedUser(currentUser)
    }

    loadData()

  }, [])

  const loadData = async () => {

    const { data: predictionsData } =
      await supabase
        .from('predictions')
        .select('*')

    if (predictionsData) {
      setPredictions(predictionsData)
    }

    const { data: officialData } =
      await supabase
        .from('official_results')
        .select('*')

    if (officialData) {
      setOfficialResults(officialData)
    }
  }

  const loginUser = () => {

    if (!username.trim()) return

    localStorage.setItem(
      'prodeUser',
      username
    )

    setSavedUser(username)
  }

  const logout = () => {

    localStorage.removeItem('prodeUser')
    location.reload()
  }

  const getPrediction = (
    home: string,
    away: string
  ) => {

    return predictions.find(
      (p) =>
        p.username === savedUser &&
        p.home_team === home &&
        p.away_team === away
    )
  }

  const savePrediction = async (
    group: string,
    home: string,
    away: string,
    homeGoals: any,
    awayGoals: any
  ) => {

    if (!savedUser) return

    const existing = getPrediction(
      home,
      away
    )

    if (existing) {

      await supabase
        .from('predictions')
        .update({
          home_goals: Number(homeGoals),
          away_goals: Number(awayGoals),
        })
        .eq('id', existing.id)

    } else {

      await supabase
        .from('predictions')
        .insert({
          username: savedUser,
          group_name: group,
          home_team: home,
          away_team: away,
          home_goals: Number(homeGoals),
          away_goals: Number(awayGoals),
        })
    }

    loadData()
  }

  const calculatePoints = (
    prediction: any,
    official: any
  ) => {

    if (!official) return 0

    const pHome = prediction.home_goals
    const pAway = prediction.away_goals

    const oHome = official.home_goals
    const oAway = official.away_goals

    if (
      pHome === oHome &&
      pAway === oAway
    ) {
      return 5
    }

    const predictedWinner =
      pHome > pAway
        ? 'home'
        : pAway > pHome
        ? 'away'
        : 'draw'

    const officialWinner =
      oHome > oAway
        ? 'home'
        : oAway > oHome
        ? 'away'
        : 'draw'

    if (
      predictedWinner === officialWinner
    ) {
      return 3
    }

    const predictedDiff =
      pHome - pAway

    const officialDiff =
      oHome - oAway

    if (
      predictedDiff === officialDiff
    ) {
      return 1
    }

    return 0
  }

  const ranking = useMemo(() => {

    const users: any = {}

    predictions.forEach((prediction) => {

      const official =
        officialResults.find(
          (o) =>
            o.home_team ===
              prediction.home_team &&
            o.away_team ===
              prediction.away_team
        )

      const points =
        calculatePoints(
          prediction,
          official
        )

      if (
        !users[prediction.username]
      ) {

        users[prediction.username] = {
          username:
            prediction.username,
          points: 0,
        }
      }

      users[prediction.username]
        .points += points
    })

    return Object.values(users).sort(
      (a: any, b: any) =>
        b.points - a.points
    )

  }, [predictions, officialResults])

  if (!savedUser) {

    return (

      <div className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>

        <div className='bg-slate-900 border border-slate-700 rounded-3xl p-10 w-full max-w-md'>

          <h1 className='text-4xl font-black text-white'>
            PRODE MUNDIAL 2026
          </h1>

          <p className='text-slate-400 mt-3'>
            Ingresá tu nombre
          </p>

          <input
            type='text'
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            placeholder='Tu nombre'
            className='w-full mt-6 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white'
          />

          <button
            onClick={loginUser}
            className='w-full mt-6 bg-blue-600 rounded-xl p-4 text-white font-bold'
          >
            Entrar
          </button>

        </div>

      </div>
    )
  }

  return (

    <div className='min-h-screen bg-slate-950 text-white p-6'>

      <div className='max-w-7xl mx-auto space-y-8'>

        <div className='bg-slate-900 rounded-3xl p-8 border border-slate-700 flex justify-between flex-wrap gap-4'>

          <div>

            <h1 className='text-5xl font-black'>
              PRODE MUNDIAL 2026
            </h1>

            <p className='text-slate-400 mt-3'>
              Usuario: {savedUser}
            </p>

          </div>

          <button
            onClick={logout}
            className='bg-red-600 px-5 py-3 rounded-xl font-bold'
          >
            Cambiar usuario
          </button>

        </div>

        <div className='bg-slate-900 rounded-3xl p-8 border border-slate-700'>

          <h2 className='text-3xl font-black mb-6'>
            Ranking Global
          </h2>

          <div className='space-y-3'>

            {ranking.map(
              (user: any, idx) => (

                <div
                  key={user.username}
                  className='bg-slate-800 rounded-xl p-4 flex justify-between items-center'
                >

                  <div className='flex gap-4 items-center'>

                    <span className='text-2xl font-black text-blue-400'>
                      #{idx + 1}
                    </span>

                    <span className='font-bold'>
                      {user.username}
                    </span>

                  </div>

                  <span className='text-green-400 font-black text-2xl'>
                    {user.points} pts
                  </span>

                </div>
              )
            )}

          </div>

        </div>

      </div>

    </div>
  )
}