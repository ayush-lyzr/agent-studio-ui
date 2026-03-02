import { Suspense, lazy } from "react";
import Loader from "@/components/loader";
// import { isDevEnv } from "@/lib/constants";

// const Mira = lazy(() => import("./mira"));
// const HomePageOld = lazy(() => import("./home-old"));
const HomeV3 = lazy(() => import("./home-v3"));

const HomePage = () => {
  return (
    <Suspense fallback={<Loader />}>
      <HomeV3 />
      {/* {isDevEnv ? <HomeV3 /> : <HomePageOld />} */}
    </Suspense>
  );
};

export default HomePage;
