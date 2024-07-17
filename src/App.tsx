import { useState, FC, ChangeEvent, useEffect } from 'react';
import axiosBase, { AxiosError, AxiosInstance } from 'axios';

import './App.css';
// ステータスコード
const STATUS_CODE = {
  OK: 200,

  BAD_REQUEST: 400,
  UNAUTHORISZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,

  INTERNAL_SERVER_ERROR: 500,
};

class AxiosUtil {
  axios: AxiosInstance;

  // コンストラクタでエラーをハンドリングする関数設定
  constructor() {
    this.axios = axiosBase.create({
      baseURL: import.meta.env.VITE_CLOUD_FUNCTION_URL,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      responseType: 'json',
    });

    // インターセプターを利用したエラー処理ハンドリング
    this.axios.interceptors.response.use(
      (response) => {
        // 成功時は普通にresponse返却
        return response;
      },
      (error: AxiosError) => {
        console.error(error);
        const status = error.response?.status || null;
        const statusText = error.response?.statusText || 'Server Error';
        const data: any = error.response?.data;
        const msg = data?.msg || '不明なエラーが発生しました';

        // 404はNotFoundに飛ばす
        if (status === STATUS_CODE['NOT_FOUND']) {
          window.location.href = `404?status=${status}&statusText=${statusText}&msg=${msg}`;
          return;
        }

        // TODO:エラー内容を表示
      },
    );
  }

  async get(path: string, headerParams?: Object) {
    console.log(`axios get ${path.split('?')[0]}`);
    return await this.axios.get(path, headerParams);
  }

  async post(path: string, params?: Object, headers?: Object) {
    console.log(`axios post ${path}`);
    return await this.axios.post(path, params, headers);
  }
}

const axiosUtil = new AxiosUtil();

const App: FC = () => {
  type Timeline = {
    postDocId: string;
    userId: string;
    content: string;
    mayHate: boolean;
    createAt: number;
    name: string;
    isShow: boolean;
  };
  const initTimelines: Timeline[] = [];
  const [timelines, setTimelines] = useState(initTimelines);
  const showHateTimeline = (timeline: Timeline) => {
    const updateTimeline = timelines.map((t) =>
      t.postDocId === timeline.postDocId ? { ...t, isShow: true } : t,
    );
    setTimelines(updateTimeline);
  };

  type ResponseTimeline = {
    post_doc_id: string;
    user_id: string;
    content: string;
    may_hate: boolean;
    create_at: number;
    name: string;
  };
  const fetchTimelines = async () => {
    //TODO:ローディングオン
    const response = await axiosUtil.get('/fetch');
    if (response) {
      const responseTimelines: ResponseTimeline[] = response.data.timelines;
      const newTimelines: Timeline[] = responseTimelines.map((t) => {
        return {
          postDocId: t.post_doc_id,
          userId: t.user_id,
          content: t.content,
          mayHate: t.may_hate,
          createAt: t.create_at,
          name: t.name,
          isShow: !t.may_hate,
        };
      });
      setTimelines(newTimelines);
    }
  };

  const [showHate, setShowHate] = useState(false);
  const handleShowHateCheckbox = (event: ChangeEvent<HTMLInputElement>) => {
    setShowHate(event.target.checked);
  };

  const formatDateToStr = (date: Date, format: string) => {
    const symbol = {
      M: date.getMonth() + 1,
      d: date.getDate(),
      h: date.getHours(),
      m: date.getMinutes(),
      s: date.getSeconds(),
    };

    const formatted = format.replace(/(M+|d+|h+|m+|s+)/g, (v) =>
      (
        (v.length > 1 ? '0' : '') + symbol[v.slice(-1) as keyof typeof symbol]
      ).slice(-2),
    );

    return formatted.replace(/(y+)/g, (v) =>
      date.getFullYear().toString().slice(-v.length),
    );
  };

  useEffect(() => {
    fetchTimelines();
  }, []);

  const getTimelineContent = (timeline: Timeline) => {
    let contentDiv = (
      <div className="text-gray-700 text-xl my-2">{timeline.content}</div>
    );
    if (!showHate && timeline.mayHate && !timeline.isShow) {
      contentDiv = (
        <div role="status" className="pt-2">
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5"></div>
          <span className="sr-only">Loading...</span>
          <div className="flex flex-row-reverse">
            <button
              onClick={() => showHateTimeline(timeline)}
              className="flex-none flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
            >
              <span className="i-material-symbols-brightness-alert w-5 h-5"></span>
              内容を表示する
            </button>
          </div>
        </div>
      );
    }
    return contentDiv;
  };
  const dispTimelines = timelines.map((timeline) => (
    <div
      key={timeline.postDocId}
      className="rounded overflow-hidden shadow-lg m-2 p-2"
    >
      <h2 className="font-bold flex items-center text-xl">
        {/* TODO:アイコン */}
        <span>
          {timeline.name} ({timeline.userId})
        </span>
        {timeline.mayHate && (
          <span className="i-material-symbols-brightness-alert w-6 h-6 text-red-500"></span>
        )}
      </h2>
      {}
      {getTimelineContent(timeline)}
      <div className="text-xs text-right">
        at {formatDateToStr(new Date(timeline.createAt), 'yyyy/MM/dd hh:mm:ss')}
      </div>
    </div>
  ));
  return (
    <>
      <nav className="w-full bg-blue-500">
        <div className="flex justify-between max-w-5xl mx-auto">
          {/* TODO:アイコン */}
          <h1 className="text-xl font-bold text-white">hide-hate</h1>
        </div>
      </nav>

      <div className="grid grid-cols-1 sm:grid-cols-3">
        <form className="grid-item m-2">
          <div className="w-full mb-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
            <div className="px-4 py-2 bg-white rounded-t-lg dark:bg-gray-800">
              <label htmlFor="comment" className="sr-only">
                Your comment
              </label>
              <textarea
                id="comment"
                rows={4}
                className="w-full px-0 text-sm text-gray-900 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400"
                required
              ></textarea>
            </div>
            {/* TODO:投稿領域閉じるボタン */}
            <div className="flex flex flex-row-reverse items-center justify-between px-3 py-2 border-t dark:border-gray-600">
              <button className="flex-none flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">
                投稿する
              </button>
            </div>
          </div>
        </form>
        <div className="grid-item col-span-2 m-2">
          <div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showHate}
                className="sr-only peer"
                onChange={handleShowHateCheckbox}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                ヘイトスピーチの可能性がある投稿を表示する
                {/* TODO: スクロールしても表示されるようにする */}
              </span>
            </label>
          </div>
          {dispTimelines}
        </div>
      </div>
    </>
  );
};

export default App;
