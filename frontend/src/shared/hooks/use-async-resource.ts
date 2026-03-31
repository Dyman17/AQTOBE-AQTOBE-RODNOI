import { useEffect, useState, type DependencyList } from "react";

type AsyncState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

export function useAsyncResource<T>(loader: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    void loader()
      .then((data) => {
        if (!active) return;
        setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          data: null,
          error: error instanceof Error ? error.message : "Не удалось загрузить данные",
          loading: false,
        });
      });

    return () => {
      active = false;
    };
  }, deps);

  return state;
}
