import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PublicBlueprintViewer from "@/components/blueprint/PublicBlueprintViewer";
import Loader from "@/components/loader";

const BlueprintViewerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn, getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const blueprintId = searchParams.get("blueprint");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getToken();
        const loggedIn = isLoggedIn && !!token;
        
        setIsAuthenticated(loggedIn);
        
        // If user is authenticated, redirect to the protected lyzr-manager route with the blueprint
        if (loggedIn && blueprintId) {
          navigate(`/lyzr-manager?blueprint=${blueprintId}`);
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isLoggedIn, getToken, blueprintId, navigate]);

  // Handle clone completion after login
  useEffect(() => {
    if (isAuthenticated) {
      const pendingClone = sessionStorage.getItem('pendingBlueprintClone');
      if (pendingClone) {
        try {
          const cloneData = JSON.parse(pendingClone);
          sessionStorage.removeItem('pendingBlueprintClone');
          
          // Navigate to lyzr-manager and trigger clone
          navigate(`/lyzr-manager?blueprint=${cloneData.blueprintId}&clone=${encodeURIComponent(cloneData.blueprintName)}`);
        } catch (error) {
          console.error("Error handling pending clone:", error);
        }
      }
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return <Loader loadingText="Checking authentication..." />;
  }

  // If no blueprint ID is provided, redirect to 404
  if (!blueprintId) {
    navigate("/404");
    return null;
  }

  // If user is not authenticated, show public viewer
  if (!isAuthenticated) {
    return <PublicBlueprintViewer blueprintId={blueprintId} />;
  }

  // This should not happen as we redirect authenticated users above,
  // but just in case
  return <Loader loadingText="Redirecting..." />;
};

export default BlueprintViewerPage;