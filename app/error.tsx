"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="page-hero"><div className="wrap"><p className="section-kicker">500 / Interrupted</p><h1>Something left the frame.</h1><p>The rest of the B28 site is safe. Try loading this section again.</p><button className="button light" onClick={reset}>Retry</button></div></main>}
