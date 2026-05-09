import { Navigate, Route, Routes } from "react-router-dom";
import { IonApp, setupIonicReact } from "@ionic/react";
import {
  DesignFrame,
  ProjectsHome,
  ProjectDetail,
  ThemeEditorPage,
  LibraryPage,
} from "@omit-design/engine/shell";
import { useProjects } from "@omit-design/engine/registry";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/flex-utils.css";

setupIonicReact({ mode: "ios" });

/**
 * 自动从 EngineRoot 拿 discovered entries 生成路由。
 * 加新稿子 = `design/<file>.tsx` + `export const meta = {...}`,路由自动生效。
 */
function DesignRoutes() {
  const projects = useProjects();
  const allEntries = projects.flatMap((p) => p.entries);
  return (
    <Routes>
      {allEntries.map((entry) => {
        const Cmp = entry.component;
        const relPath = entry.href.replace(/^\/designs\//, "");
        return <Route key={entry.href} path={relPath} element={<Cmp />} />;
      })}
      <Route path="" element={<Navigate to="main/welcome" replace />} />
    </Routes>
  );
}

function DesignsRoot() {
  return (
    <DesignFrame>
      <IonApp>
        <DesignRoutes />
      </IonApp>
    </DesignFrame>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/workspace" replace />} />
      <Route path="/workspace" element={<ProjectsHome />} />
      <Route path="/workspace/:projectId" element={<ProjectDetail />} />
      <Route
        path="/workspace/:projectId/theme-editor"
        element={<ThemeEditorPage />}
      />
      <Route
        path="/workspace/:projectId/library"
        element={<LibraryPage />}
      />
      <Route path="/designs/*" element={<DesignsRoot />} />
    </Routes>
  );
}
