'use client'
import { useEffect, useState } from 'react'
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

  useEffect(() => {

    const currentUser =
      localStorage.getItem('prodeUser')

    if (currentUser) {
      setSavedUser(currentUser)
    }

    loadPredictions()

  }, [])

  const loadPredictions = async () => {

    const { data } = await supabase
      .from('predictions')
      .select('*')

    if (data) {
      setPredictions(data)
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

    loadPredictions()
  }

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
            className='w-full mt-6 bg-blue-600 hover:bg-blue-500 transition rounded-xl p-4 text-white font-bold'
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

        <div className='bg-slate-900 rounded-3xl p-8 border border-slate-700 flex items-center justify-between flex-wrap gap-4'>

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
            className='bg-red-600 hover:bg-red-500 transition px-5 py-3 rounded-xl font-bold'
          >
            Cambiar usuario
          </button>

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
                    ? 'bg-blue-600 px-5 py-3 rounded-xl font-bold'
                    : 'bg-slate-800 px-5 py-3 rounded-xl font-bold'
                }
              >
                {group}
              </button>
            )
          )}

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
                  className='bg-slate-900 rounded-2xl p-5 border border-slate-700'
                >

                  <div className='flex items-center gap-4 flex-wrap'>

                    <span className='w-40 font-bold'>
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
                      className='w-16 bg-slate-950 border border-slate-600 rounded-lg p-2 text-center'
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
                      className='w-16 bg-slate-950 border border-slate-600 rounded-lg p-2 text-center'
                    />

                    <span className='w-40 font-bold'>
                      {match[1]}
                    </span>

                  </div>

                </div>
              )
            }
          )}

        </div>

        <div className='bg-slate-900 rounded-3xl p-8 border border-slate-700'>

          <h2 className='text-3xl font-black mb-6'>
            Predicciones de todos
          </h2>

          <div className='space-y-3'>

            {predictions.map((p) => (

              <div
                key={p.id}
                className='bg-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center'
              >

                <span className='font-bold text-blue-400'>
                  {p.username}
                </span>

                <span>
                  {p.home_team}
                </span>

                <span className='font-black'>
                  {p.home_goals}
                  {' - '}
                  {p.away_goals}
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