'use client'
import Desktop from "../components/desktop";
import Window from "../components/window"
import icons from './icons.json';
import { useReducer, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import axios from "axios";
import { GetLeaderboard } from "../database";
import { UserData, LeaderboardUser } from "../components/database-parse-type";

function Title({children} : {children: React.ReactNode}) {
    return(
        <div className="text-3xl text-black text-center">
            {children}
        </div>
    )
}

function Header({children} : {children: React.ReactNode}) {
    return(
        <div className="flex window justify-center text-xl text-black text-center">
            {children}
        </div>
    )
}

function TWMTable({children} : {children: React.ReactNode}) {
    return (
        <div className='flex justify-center'>
            {children}
        </div>
    )
}

function TableColumn({children} : {children: React.ReactNode}) {
    return (
        <div className="grid">
            {children}
        </div>
    )
}

function TableHeader({name} : {name: string}) {
    return (
        <div className="window text-center text-black min-w-[5px]">
            <p className="text-lg mx-2">{name}</p>
        </div>
    )
}

function TableItem({item} : {item: string}) {

    return (
        <div className="flex justify-center bg-white border-2 text-black">
            <p className="text-sm sm:text-lg mx-2">{item}</p>
        </div>
    )
}

function PageStatus(status: string) {

    if (status === 'loading') {
        return (
            <Desktop>
            <Window title='Leaderboards' className="">
                <div className="text-xl text-black">Loading...</div>
            </Window>
            </Desktop>
        )
    } else if (status === 'authing') {
        return (
          <Desktop>
            <Window title='Leaderboards' className="">
              <div className="text-xl text-black">Authenticating...</div>
            </Window>
          </Desktop>
    )
    } else if (status === 'error') {
        return (
            <Desktop>
            <Window title='Error!' className="">
                <div className="text-xl text-black">An error has occurred. Please try again later.</div>
            </Window>
            </Desktop>
        )
    } else if (status === 'unauthenticated') {
        return (
            <Desktop>
            <Window title='Error!' className="grid justify-center items-center">
                <div className="text-xl text-black text-center">You need to be signed in to Discord to access this page!</div>
                <div className="mx-auto mt-5 scale-120">
                <button onClick={() => signIn('discord')}>Sign In</button> <button onClick={() => window.location.href = '/'}>Okay</button>
                </div>
            </Window>
            </Desktop>
        )
    }
}

function Page(
    wool: LeaderboardUser[],
    suns: LeaderboardUser[],
    times_shattered: LeaderboardUser[],
    times_transmitted: LeaderboardUser[]
) {
    return (
        <Desktop>
            <Window title="Leaderboards" className="max-w-[700px]">
                <Title>Global Leaderboards</Title>
                <p className='text-center text-black'>(Loading may take a while.)</p>
                <div className="mt-5"/>

                <Header><p className='text-xl mr-2'>Wool</p> <img src={icons.wool_icon}/></Header>
                <div className="mt-2"/>
                {AssignToLeaderboard('wool', wool)}
                <div className="mt-5"/>

                <Header><p className='text-xl mr-2'>Suns</p> <img src={icons.sun_icon}/></Header>
                <div className="mt-2"/>
                {AssignToLeaderboard('suns', suns)}
                <div className="mt-5"/>

                <Header><p className='text-xl mr-2'>Times Shattered</p> <img src={icons.explode_icon}/></Header>
                <div className="mt-2"/>
                {AssignToLeaderboard('times_shattered', times_shattered)}
                <div className="mt-5"/>

                <Header><p className='text-xl mr-2'>Times Transmitted</p> <img src={icons.transmit_icon}/></Header>
                <div className="mt-2"/>
                {AssignToLeaderboard('times_transmitted', times_transmitted)}
                <div className="mt-5"/>
            </Window>
        </Desktop>
    )
}

function AssignToLeaderboard(type_name: string, leaderboard: LeaderboardUser[]) {

    if (leaderboard.length === 0) {
        return(
            <TWMTable>
                <TableColumn>
                    <TableHeader name='#'/>
                    <TableItem item='1.'/>
                </TableColumn>
                <TableColumn>
                    <TableHeader name='User'/>
                    <TableItem item='Loading...'/>
                </TableColumn>
                <TableColumn>
                    <TableHeader name='Amount'/>
                    <TableItem item='Loading...'/>
                </TableColumn>
            </TWMTable>
        )
    } else {
        return(
            <TWMTable>
                <TableColumn>
                    <TableHeader name='#'/>
                    {leaderboard.map((user, index) => (
                        <TableItem item={`${index + 1}.`} key={index}/>
                    ))}
                </TableColumn>
                <TableColumn>
                    <TableHeader name='User'/>
                    {leaderboard.map((user, index) => (
                        <TableItem item={user.name} key={index}/>
                    ))}
                </TableColumn>
                <TableColumn>
                    <TableHeader name='Amount'/>
                    {
                        leaderboard.map((user, index) => (
                            <TableItem item={String((user.data as any)[type_name].toLocaleString())} key={index}/>
                        ))
                    }
                </TableColumn>
            </TWMTable>
        )
    }
}

export default function Main() {
    const [pageStatus, setPageStatus] = useState('loading');

    const [rankedWoolUsers, setRankedWoolUsers] = useState<LeaderboardUser[]>([]);
    const [rankedSunUsers, setRankedSunUsers] = useState<LeaderboardUser[]>([]);
    const [rankedTimesTransmittedUsers, setRankedTimesTransmittedUsers] = useState<LeaderboardUser[]>([]);
    const [rankedTimesShatteredUsers, setRankedTimesShatteredUsers] = useState<LeaderboardUser[]>([]);

    const [, forceUpdate] = useReducer(x => x + 1, 0);

    useEffect(() => {
        async function grabLeaderboardData() {
            try {
                setRankedWoolUsers(await GetLeaderboard('wool'));
                setRankedSunUsers(await GetLeaderboard('suns'));
                setRankedTimesShatteredUsers(await GetLeaderboard('times_shattered'));
                setRankedTimesTransmittedUsers(await GetLeaderboard('times_transmitted'));

                setPageStatus('success');
            } catch (error) {
                console.error('Error fetching leaderboard data:', error);
                setPageStatus('error');
            }
        }

        grabLeaderboardData();
    }, []);

    if (pageStatus === 'error') {
        return PageStatus('error');
    }

    return Page(rankedWoolUsers, rankedSunUsers, rankedTimesShatteredUsers, rankedTimesTransmittedUsers); // return page
  }