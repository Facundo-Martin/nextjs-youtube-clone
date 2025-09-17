import React from "react";
import { CategoriesSection } from "../sections/categories-section";

type Props = {
  categoryId?: string;
};

export const HomeView = ({ categoryId }: Props) => {
  return (
    <div className="max-w-screen-[2400px] mx-auto mb-10 flex flex-col gap-y-6 px-4 pt-2.5">
      <CategoriesSection categoryId={categoryId} />
    </div>
  );
};
