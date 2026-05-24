import React,{lazy, suspense} from 'react';

// Current — everything loaded upfront

const Dashboard = lazy(() => import('./Dashboard'))
const Analytics = lazy (() => import('./Analytics'))
const Settings = lazy(() => import('./Settings'))
const Admin = lazy(() => import('./Admin'))

const App = () => {
  const { role } = useUser();

  return (
    <Router>
      <Suspense fallback={<Spinner />} // suspense loads lazy routes, provide fallback during load.
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/settings" component={Settings} />
        
        {role === 'admin' && (<Route path="/admin" component={AdminPanel} />) }
      </Suspense>
    </Router>
  );
};


const Settings = lazy(() => import(/* webpackChunkName: "settings" */'./Settings'))



-------------------------------------------------------------------------------------------------------------------------

//react-window implementation

import React from 'react';
import {FixedSizeList} from 'react-window';

const ProductList = ({products}) => {
  
  // Row renderer - called only for visible items.
  const Row = ({index, style}) => {
    const product = products[index]

    return(
      <div style={style}>
        <ProductItem product={product} />
      </div>
    )
  }

  return(
    <FixedSizeList
      height={600}
      width=100%
      itemCount={products.length}
      itemSize={80}
    >
    {Row}
    </FixedSizeList>
  )
}

-------------------------------------------------------------------------------------------------------------------------


const useDebounce = (searchItem, delay) => {
  const [data, setData] = useState('')

  useEffect(() => {
    const interval = setTimeout(() => {
      setData(searchItem)
    }, delay)

    return () => clearTimeout(interval)

  }, [searchItem, delay])

  return data

}

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

   const debounceQuery = useDebounce(query, 3000)

  // Fetches on every keystroke
  useEffect(() => {

  if(!debounceQuery) return

    const controller = new AbortController()

    const fetchData = async()=>{
      try{
        const res = await fetch(`/api/search?q=${query}`,{signal: controller.signal})
        if(!res.ok) throw new Error(`Https error ${res.status}`)
        const data = await res.json()
        setResults(data)
      }catch(err){
        if(err.name === 'AbortError') return
        console.log(err)
      }

    }

    fetchData()

    return () => controller.abort()

  }, [debounceQuery]);

  // Sorts results on every render
  const sorted = useMemo(() => {
    return [...results].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    },[results])

   

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <ul>
        {sorted.map((item) => (
         <ListItem key={item.id} name={item.name} />
        ))}
      </ul>
    </div>
  );
};

const ListItem = React.memo({ name}) => {
  return(
     <li>{name}</li>
  )
})











































