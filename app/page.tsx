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

  const calculateTable = () => {

    const table: any = {}

    groupsData[selectedGroup].forEach(
      (match) => {

        const prediction =
          predictions.find(
            (p) =>
              p.username === savedUser &&
              p.home_team === match[0] &&
              p.away_team === match[1]
          )

        if (!prediction) return

        const teams = [
          match[0],
          match[1]
        ]

        teams.forEach((team) => {

          if (!table[team]) {

            table[team] = {
              team,
              pts: 0,
              gf: 0,
              gc: 0,
              dg: 0,
            }
          }
        })

        const homeGoals =
          prediction.home_goals

        const awayGoals =
          prediction.away_goals

        table[match[0]].gf +=
          homeGoals

        table[match[0]].gc +=
          awayGoals

        table[match[1]].gf +=
          awayGoals

        table[match[1]].gc +=
          homeGoals

        table[match[0]].dg =
          table[match[0]].gf -
          table[match[0]].gc

        table[match[1]].dg =
          table[match[1]].gf -
          table[match[1]].gc

        if (homeGoals > awayGoals) {

          table[match[0]].pts += 3

        } else if (
          awayGoals > homeGoals
        ) {

          table[match[1]].pts += 3

        } else {

          table[match[0]].pts += 1
          table[match[1]].pts += 1
        }
      }
    )

    return Object.values(table).sort(
      (a: any, b: any) => {

        if (b.pts !== a.pts)
          return b.pts - a.pts

        if (b.dg !== a.dg)
          return b.dg - a.dg

        return b.gf - a.gf
      }
    )
  }

  const table = calculateTable()

  if (!savedUser) {

    return (
      <div className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>

        <div className='bg-slate-900 rounded-3xl p-10 w-full max-w-md'>

          <h1 className='text-4xl font-black'>
            PRODE MUNDIAL 2026
          </h1>

          <input
            type='text'
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            placeholder='Tu nombre'
            className='w-full mt-6 bg-slate-950 border border-slate-700 rounded-xl p-4'
          />

          <button
            onClick={loginUser}
            className='w-full mt-4 bg-blue-600 rounded-xl p-4 font-bold'
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

        <div className='bg-slate-900 rounded-3xl p-8 flex justify-between'>

          <div>

            <h1 className='text-5xl font-black'>
              PRODE MUNDIAL 2026
            </h1>

            <p className='text-slate-400 mt-2'>
              {savedUser}
            </p>

          </div>

          <button
            onClick={logout}
            className='bg-red-600 px-5 py-3 rounded-xl font-bold'
          >
            Salir
          </button>

        </div>

        <div className='bg-slate-900 rounded-3xl p-8'>

          <h2 className='text-3xl font-black mb-6'>
            Ranking
          </h2>

          <div className='space-y-3'>

            {ranking.map(
              (user: any, idx) => (

                <div
                  key={user.username}
                  className='bg-slate-800 rounded-xl p-4 flex justify-between'
                >

                  <span>
                    #{idx + 1} {user.username}
                  </span>

                  <span className='text-green-400 font-black'>
                    {user.points} pts
                  </span>

                </div>
              )
            )}

          </div>

        </div>

        <div className='flex flex-wrap gap-3'>

          {Object.keys(groupsData).map(
            (group) => (

              <button
                key={group}
                onClick={() =>
                  setSelectedGroup(
                    group as keyof typeof groupsData
                  )
                }
                className={
                  selectedGroup === group
                    ? 'bg-blue-600 px-5 py-3 rounded-xl'
                    : 'bg-slate-800 px-5 py-3 rounded-xl'
                }
              >
                {group}
              </button>
            )
          )}

        </div>

        <div className='bg-slate-900 rounded-3xl p-8'>

          <h2 className='text-3xl font-black mb-6'>
            Tabla del Grupo
          </h2>

          <div className='space-y-3'>

            {table.map((team: any) => (

              <div
                key={team.team}
                className='bg-slate-800 rounded-xl p-4 flex justify-between'
              >

                <span>
                  {team.team}
                </span>

                <span>
                  {team.pts} pts
                </span>

              </div>
            ))}

          </div>

        </div>

        <div className='space-y-4'>

          {groupsData[selectedGroup].map(
            (match, idx) => {

              const prediction =
                getPrediction(
                  match[0],
                  match[1]
                )

              return (

                <div
                  key={idx}
                  className='bg-slate-900 rounded-2xl p-5'
                >

                  <div className='flex items-center gap-4 flex-wrap'>

                    <span className='w-40'>
                      {match[0]}
                    </span>

                    <input
                      type='number'
                      defaultValue={
                        prediction?.home_goals || 0
                      }
                      onBlur={(e) => {

                        const homeGoals =
                          e.target.value

                        const awayInput =
                          document.getElementById(
                            `away-${idx}`
                          ) as HTMLInputElement

                        const awayGoals =
                          awayInput?.value || 0

                        savePrediction(
                          selectedGroup,
                          match[0],
                          match[1],
                          homeGoals,
                          awayGoals
                        )
                      }}
                      className='w-16 bg-slate-950 rounded-lg p-2 text-center'
                    />

                    <span>
                      vs
                    </span>

                    <input
                      id={`away-${idx}`}
                      type='number'
                      defaultValue={
                        prediction?.away_goals || 0
                      }
                      onBlur={(e) => {

                        const awayGoals =
                          e.target.value

                        const inputs =
                          document.querySelectorAll(
                            'input'
                          )

                        const homeGoals =
                          (
                            inputs[
                              idx * 2
                            ] as HTMLInputElement
                          )?.value || 0

                        savePrediction(
                          selectedGroup,
                          match[0],
                          match[1],
                          homeGoals,
                          awayGoals
                        )
                      }}
                      className='w-16 bg-slate-950 rounded-lg p-2 text-center'
                    />

                    <span className='w-40'>
                      {match[1]}
                    </span>

                  </div>

                </div>
              )
            }
          )}

        </div>

        <div className='bg-slate-900 rounded-3xl p-8'>

          <h2 className='text-3xl font-black mb-6'>
            Predicciones de Todos
          </h2>

          <div className='space-y-3'>

            {predictions.map((p) => (

              <div
                key={p.id}
                className='bg-slate-800 rounded-xl p-4 flex gap-4 flex-wrap'
              >

                <span className='text-blue-400 font-bold'>
                  {p.username}
                </span>

                <span>
                  {p.home_team}
                </span>

                <span className='font-black'>
                  {p.home_goals} - {p.away_goals}
                </span>

                <span>
                  {p.away_team}
                </span>

              </div>
            ))}

          </div>

        </div>

      </div>

    </div>
  )
}