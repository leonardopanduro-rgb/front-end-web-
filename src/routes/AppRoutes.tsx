import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { LoadingState } from '../components/LoadingState';
import { PublicRoute } from './PublicRoute';
import { ProtectedRoute } from './ProtectedRoute';

const WelcomePage = lazy(() => import('../pages/WelcomePage').then((m) => ({ default: m.WelcomePage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const SetupVehiclePage = lazy(() => import('../pages/SetupVehiclePage').then((m) => ({ default: m.SetupVehiclePage })));
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const SearchTripsPage = lazy(() => import('../pages/SearchTripsPage').then((m) => ({ default: m.SearchTripsPage })));
const TripDetailPage = lazy(() => import('../pages/TripDetailPage').then((m) => ({ default: m.TripDetailPage })));
const PublishTripPage = lazy(() => import('../pages/PublishTripPage').then((m) => ({ default: m.PublishTripPage })));
const MyRequestsPage = lazy(() => import('../pages/MyRequestsPage').then((m) => ({ default: m.MyRequestsPage })));
const DriverPanelPage = lazy(() => import('../pages/DriverPanelPage').then((m) => ({ default: m.DriverPanelPage })));
const VehiclePage = lazy(() => import('../pages/VehiclePage').then((m) => ({ default: m.VehiclePage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ReviewPage = lazy(() => import('../pages/ReviewPage').then((m) => ({ default: m.ReviewPage })));

export const AppRoutes = () => (
  <Suspense fallback={<LoadingState message="Cargando vista..." />}>
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/setup-vehicle" element={<SetupVehiclePage />} />
          <Route path="/home" element={<DashboardPage />} />
          <Route path="/search-trips" element={<SearchTripsPage />} />
          <Route path="/trips/:publicationId" element={<TripDetailPage />} />
          <Route path="/publish-trip" element={<PublishTripPage />} />
          <Route path="/requests" element={<MyRequestsPage />} />
          <Route path="/driver-panel" element={<DriverPanelPage />} />
          <Route path="/vehicles" element={<VehiclePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/review/:rideId" element={<ReviewPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);
