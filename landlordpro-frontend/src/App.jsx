import { RouterProvider } from 'react-router'
import './App.css'
import { store } from './store/index'
import {Provider} from 'react-redux'
import { router } from './routes/index'

function App() {

  return (
    <>
      <Provider store={store}>
          <RouterProvider router={router}/>
      </Provider>
    </>
  )
}

export default App
