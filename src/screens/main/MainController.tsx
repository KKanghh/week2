import { useInfiniteQuery } from "@tanstack/react-query";
import request from "~/libs/getPost";
import React, { useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "~/store/modules";
import { scrollActions } from "~/store/modules/scroll";
import { Notice } from "~/types/Notice";
import MainView from "./MainView";
import { MainViewProps } from "./MainView";

interface MainControllerProps {
  props: any;
}

const MainController: React.FC<MainControllerProps> = ({ props }) => {
  const scroll = useSelector<RootState, number>((state) => state.scroll.scroll);
  const dispatch = useDispatch();
  const divRef = useRef<HTMLDivElement>(null);
  const fetchData = async ({ pageParam = 1 }) => {
    const res = await request.get(`/post`, {
      params: {
        sort: "createdAt,desc",
        p: pageParam,
        // board: "announcement",
      },
    });
    return res.data;
  };

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery(["notice"], fetchData, {
    getNextPageParam: (lastPage, page) => {
      if (lastPage.last) return false;
      return page.length + 1;
    },
    initialData: { pages: [props], pageParams: [1] },
    // placeholderData: { pages: [props], pageParams: [2] },
  });
  let notices: Notice[] = [];
  const responses = data?.pages.map((page) => page.content);
  responses?.forEach((response) => {
    notices = notices.concat(response);
  });

  useEffect(() => {
    console.log(isLoading, isFetching);
  }, [isFetching, isLoading]);

  useEffect(() => {
    if (scroll > 0) {
      window.scrollTo(0, scroll);
      dispatch(scrollActions.resetScroll());
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    if (!divRef.current) return;

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    io.observe(divRef.current);

    return () => {
      io.disconnect();
    };
  }, [fetchNextPage, hasNextPage, data]);

  const viewProps: MainViewProps = { notices, divRef };
  return <MainView {...viewProps} />;
};

export default MainController;
