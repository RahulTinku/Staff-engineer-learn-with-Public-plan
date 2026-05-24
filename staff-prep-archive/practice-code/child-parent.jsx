const ChildComponent = (props) => {
	console.log('child component reders')
	return(
		<div>{props.name}</div>
	)
}


import React,{useState} from 'react';
const ParentComponent = () => {

	const [counter, setCounter] = useState(0)
	return(
		<>
			<button onClick={() => setCounter(counter => counter+1)}>Counter </button>
			<span>{counter}</span>
			React.memo(<ChildComponent props={name:'Rahul'} />)
		</>
	)
}


import React,{useState} from 'react'

const ChildComponent = React.memo(props) => {
	console.log('child component rendered')
	return(
		<div>{props.name}</div>
	)
}

const ParentComponent = () => {
	const [counter, setCounter] = useState(0)

	return(
		<button onClick={() => setCounter(c => c+1)}>Increment</button>
		<span>{counter}</span>
		<ChildComponent name='Rahul' />
	)
}
--------------------------------------------------------------------------
import React,{useState, useMemo, memo} from 'react'

cosnt Child = memo((props) => {
	return(
		<div>{props.name}</div>
	)
})

const Parent = () => {

	const [counter, setCounter] = useState(0); 
	const config = useMemo(()=> ({theam: 'dark'}), [])  // useMemo memoizes object

	return(
		<button onClick={()=> setCounter(c => c+1)}> Increase </button>
		<span>{counter}</span>
		<Child name="Rahul" />
	)
}


---

import React,{useState, useCallback, memo} from 'react';

const Child =memo ((props) => {
	return(
		<button onClick={props.onClick}>{props.name}</button>
	)
})

const Parent = () => {
	const [counter, setCounter] = useState(0)

	const handleClick = useCallback(() => {
		console.log('clicked from parent')
	},[])

	return(
		<div>
			<button onClick = (() => setCounter(c => c+1))> Increase </button>
			<span> {counter} </span>
			<Child name="Rahul" onClick={handleClick} />
		</div>
	)

}



-----------------------------------------------------------------------------

import React, {useState, useMemo, useCallback} from 'react'


const ListItem = memo(({item, config, onSelect}) => {
	console.log('ListItem rendered:', item.id);
	return(
		<li style={config} onClick={onSelect}>{item.value}</li>
	)
})

const ItemList = ({searchTerm}) => {
	const [items, setItems] = useState(initialItems)

	const filteredItem = items.filter((item, index) => item.name.include(searchTerm))

	return(
		<ul>
			{filteredItem.map((item, index) => 
				<ListItem
					key={item.id}
					item={item}
					config = {useMemo(() => ({theam:'dark'}),[])}
					onSelect= useCallback(() => (
						setItems(prev => prev.map( i=> ({...i, selected : i.id === item.id})))
					), [])
			)}
		</ul>
	)

}
















