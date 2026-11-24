import { useState, useEffect, createContext, useContext } from 'react';

interface Post {
  id: number;
  content: string;
  score: number;
  createdAt: string;
  hidden: boolean;
}

type PostCreateInfo = {[k in Omit<'id', keyof Post>]: Post[k]};

interface PostOps {
  get all(): Promise<Post[]>;
  delete(id: number): Promise<void>;
  update(id:number, updated: PostCreateInfo): Promise<void>;
  create(info: PostCreateInfo): Promise<void>;
}

const NOOP_POST_OPS = {
  get all() {
    return new Promise((resolve) => resolve([]));
  },
  async delete(id) {},
  async update(id, updated){},
  async create(info) {}
} satisfies PostOps;

const PostOpsContext = createContext(NOOP_POST_OPS);


function AdminPage() {
  const ops = useContext(PostOpsContext);
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(()=>{
    let ignore = false;
    async function exc() {
      const res = await ops.all;
      if (!ignore) setPosts(res);
    }
    exc();
    return () => void(ignore = true);
  }, [ops]);

  const [content, setContent] = useState('');
  const [score, setScore] = useState(0);
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().substring(0, 16));
  const [hidden, setHidden] = useState(false);

  const PostElement = (post:Post) => {
    const [content, setContent] = useState(post.content);
    const [score, setScore] = useState(post.score);
    const [createdAt, setCreatedAt] = useState(new Date(post.createdAt).toISOString().substring(0, 16));
    const [hidden, setHidden] = useState(post.hidden);
    return <>
             <form onSubmit={(e =>{
               e.preventDefault();
               ops.update(post.id, {content, score, createdAt, hidden});
             })}>
               <textarea value={content} onChange={e => setContent(e.target.value)}/>
               <input type='number' value={score} onChange={e => {
                 const v = +e.target.value;
                 if (!isNaN(v)) setScore(v);
               }}/>
               <input type='datetime-local' value={createdAt} onChange={e => setCreatedAt(e.target.value)}/>
               <input type='checkbox' value={hidden} onChange={e => setHidden(e.target.toggled)}/>
               <input type='submit'/>
             </form>
             <button onClick={_ => ops.delete(post.id)}>delete</button>
           </>
  }
  return <>
           {posts.map(it => <PostElement key={it.id} {...it}/>)}
           <form onSubmit={e => {
             e.preventDefault();
             ops.create({content, score, createdAt, hidden}).then(async(_) => {
               setPosts(await ops.all);
             });
             setContent('');
             setScore(0);
             setCreatedAt(new Date().toISOString().substring(0, 16));
             setHidden(false);
           }}>
             <textarea value={content} onChange={e => setContent(e.target.value)}/>
             <input type='number' value={score} onChange={e => {
               const v = +e.target.value;
               if (!isNaN(v)) setScore(v);
             }}/>
             <input type='datetime-local' value={createdAt} onChange={e => setCreatedAt(e.target.value)}/>
             <input type='checkbox' value={hidden} onChange={e => setHidden(e.target.toggled)}/>
             <input type='submit'/>
           </form>
         </>
}

function ModeratorPage() {
  const ops = useContext(PostOpsContext);
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(()=>{
    let ignore = false;
    async function exc() {
      const res = await ops.all;
      if (!ignore) setPosts(res);
    }
    exc();
    return () => void(ignore = true);
  }, [ops]);

  const PostElement = (post:Post) => {
    const [content, setContent] = useState(post.content);
    const [score, setScore] = useState(post.score);
    const [createdAt, setCreatedAt] = useState(new Date(post.createdAt).toISOString().substring(0, 16));
    const [hidden, setHidden] = useState(post.hidden);
    return <form onSubmit={(e => {
      e.preventDefault();
      ops.update(post.id, {content, score, createdAt, hidden});
    })}>
             <textarea value={content} onChange={e => setContent(e.target.value)}/>
             <input type='number' value={score} onChange={e => {
               const v = +e.target.value;
               if (!isNaN(v)) setScore(v);
             }}/>
             <input type='datetime-local' value={createdAt} onChange={e => setCreatedAt(e.target.value)}/>
             <input type='checkbox' value={hidden} onChange={e => setHidden(e.target.toggled)}/>
             <input type='submit'/>
           </form>;
  }
  return <>{posts.map(it => <PostElement key={it.id} {...it}/>)}</>
}

function UserPage() {
  const ops = useContext(PostOpsContext);
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(()=>{
    let ignore = false;
    async function exc() {
      const res = await ops.all;
      if (!ignore) setPosts(res);
    }
    exc();
    return () => void(ignore = true);
  }, [ops]);

  return <>
           {posts.filter(it => !it.hidden).map(it => <div key={it.id}>
                                                       <p>{it.content}</p>
                                                       <p>{it.score}</p>
                                                       <p>{new Date(it.createdAt).toLocaleString()}</p>
                                                     </div>)}
         </>
}

const PAGES = {
    admin: AdminPage,
    moderator: ModeratorPage,
    user: UserPage,
} as const;

type Page = keyof typeof PAGES;

const BACKEND_URL = 'http://localhost:3000/posts';

export default function App() {
  const [page, setPage] = useState<Page>('user');
  const Page = PAGES[page];
  return <PostOpsContext value={{
    get all() {
      return fetch(BACKEND_URL).then(r => r.json()) as Promise<Post[]>;
    },
    async update(id, updated) {
      await fetch(BACKEND_URL + `/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'Application/json'
        },
        body: JSON.stringify(updated)
      });
    },
    async delete(id) {
      await fetch(BACKEND_URL + `/${id}`, {
        method: 'DELETE',
      });
    },
    async create(info) {
      await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'Application/json'
        },
        body: JSON.stringify(info)
      });
    }
  }}>
           <nav>
             {Object.keys(PAGES).map((it, idx) => <button key={idx} onClick={_ => setPage(it)}>{it}</button>)}
           </nav>
           <Page/>
         </PostOpsContext>
}
