import { Route, Routes } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { paths } from '@/paths';

export default function App() {
  return (
    <Routes>
      <Route path={paths.home} element={<HomePage />} />
    </Routes>
  );
}
