import {
  useState,
  FC,
  ChangeEvent,
  useEffect,
  MouseEvent,
  MouseEventHandler,
} from 'react';
import axiosBase, { AxiosError, AxiosHeaders, AxiosInstance } from 'axios';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  connectAuthEmulator,
} from 'firebase/auth';

// Firebaseの初期化
const GCP_PROJECTS_ID = import.meta.env.VITE_GCP_PROJECTS_ID || '';
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: GCP_PROJECTS_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
const app = initializeApp(config);
const auth = getAuth(app);
if (process.env.NODE_ENV !== 'production') {
  connectAuthEmulator(auth, import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL);
}

import './App.css';
import {
  AppBar,
  Button,
  Toolbar,
  Typography,
  FormControl,
  TextField,
  Card,
  CardContent,
  CardActions,
  Collapse,
  IconButton,
  IconButtonProps,
  styled,
  Box,
  FormControlLabel,
  Switch,
  Skeleton,
  Menu,
  MenuItem,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';

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

const App: FC = () => {
  // エラーダイアログ
  type ErrorDialog = {
    isOpen: boolean;
    title: string;
    content: string;
    ok: MouseEventHandler<HTMLButtonElement> | null;
    okButtonLabel: string;
    cancelButtonLabel: string;
  };
  const closedErrorDialog: ErrorDialog = {
    isOpen: false,
    title: '',
    content: '',
    ok: null,
    okButtonLabel: 'OK',
    cancelButtonLabel: 'キャンセル',
  };
  const [errorDialog, setErrorDialog] = useState(closedErrorDialog);
  const closeErrorDialog = () => {
    setErrorDialog(closedErrorDialog);
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

          // エラー内容を表示
          setErrorDialog({
            isOpen: true,
            title: `${status} ${statusText}`,
            content: msg,
            ok: null,
            okButtonLabel: '',
            cancelButtonLabel: '閉じる',
          });
        },
      );
    }

    async get(path: string, headers?: AxiosHeaders) {
      console.log(`axios get ${path.split('?')[0]}`);
      return await this.axios.get(path, { headers: headers });
    }

    async post(path: string, params?: Object, headers?: AxiosHeaders) {
      console.log(`axios post ${path}`);
      return await this.axios.post(path, params, { headers: headers });
    }
  }

  const axiosUtil = new AxiosUtil();

  type Timeline = {
    postDocId: string;
    userId: string;
    content: string;
    mayHate: boolean;
    createAt: number;
    name: string;
    isShow: boolean;
  };
  const [timelines, setTimelines] = useState<Timeline[]>([]);
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
  const timelinesResponse2Json = (
    responseTimelines: ResponseTimeline[],
  ): Timeline[] => {
    return responseTimelines.map((t) => {
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
  };
  const fetchTimelines = async () => {
    const response = await axiosUtil.get('/fetch');
    if (response) {
      const responseTimelines: ResponseTimeline[] = response.data.timelines;
      const newTimelines: Timeline[] =
        timelinesResponse2Json(responseTimelines);
      setTimelines(newTimelines);
    }
  };

  const [showHate, setShowHate] = useState<boolean>(false);
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

  type User = {
    id: string;
    email: string;
    name: string;
  };
  const [user, setUser] = useState<User | null>(null);

  const getIdentityPlatformUser = () => {
    let user = null;

    try {
      if (auth.currentUser && auth.currentUser) {
        user = auth.currentUser;
      }
    } catch (error) {
      console.log(error);
    } finally {
      return user;
    }
  };

  interface ExpandMoreProps extends IconButtonProps {
    expand: boolean;
  }

  const [expanded, setExpanded] = useState(true);
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const [post, setPost] = useState('');
  const handlePostChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPost(event.target.value);
  };
  type PostResponse = {
    may_hate: boolean;
    timelines: ResponseTimeline[];
  };
  const createPost = async (content: string, acceptMayHate: boolean) => {
    const idToken = await getIdToken();
    const headers = new AxiosHeaders({
      Authorization: 'Bearer ' + idToken,
      'content-type': 'application/json',
    });
    const response = await axiosUtil.post(
      '/post',
      {
        content: content,
        accept_may_hate: acceptMayHate,
      },
      headers,
    );
    return response.data as PostResponse;
  };
  const repost = async (content: string) => {
    closeErrorDialog();
    const postResponse: PostResponse = await createPost(content, true);
    if (postResponse.timelines.length) {
      // タイムライン更新
      const newTimelines: Timeline[] = timelinesResponse2Json(
        postResponse.timelines,
      );
      setTimelines(newTimelines);
      setPost('');
    }
  };
  const handlePostButtonClick = async () => {
    const postResponse: PostResponse = await createPost(post, false);
    // ヘイトかもフラグ立っていてタイムライン帰ってきていない場合は再送するか確認を取る
    if (postResponse.may_hate && postResponse.timelines.length === 0) {
      setErrorDialog({
        isOpen: true,
        title: '投稿内容の確認',
        content:
          'あなたの投稿はヘイトスピーチとみなされる可能性があります。そのまま投稿しますか？',
        ok: () => {
          repost(post);
        },
        okButtonLabel: '投稿',
        cancelButtonLabel: 'キャンセル',
      });
    } else {
      // そうでない場合は正常系なので、タイムライン更新
      const newTimelines: Timeline[] = timelinesResponse2Json(
        postResponse.timelines,
      );
      setTimelines(newTimelines);
      setPost('');
    }
  };

  const initUser = async () => {
    // ユーザー情報取得
    let identityPlatformUser = getIdentityPlatformUser();
    if (identityPlatformUser) {
      // サーバからユーザ情報取得
      await getUser();
    } else {
      // authが未ロードの場合もあるので、その場合はロードを待つ
      onAuthStateChanged(auth, async () => {
        identityPlatformUser = getIdentityPlatformUser();
        if (identityPlatformUser) {
          // TODO: サーバからユーザ情報取得
          await getUser();
        } else {
          // TODO: 未ログイン時は未ログインであることを通知する
          const message =
            'ログインしていません。ログインしていない場合、一部の機能が制限されます。';
          setErrorDialog({
            isOpen: true,
            title: `ログインエラー`,
            content: message,
            ok: null,
            okButtonLabel: '',
            cancelButtonLabel: '閉じる',
          });
        }
      });
    }
  };
  const getUser = async () => {
    const idToken = await getIdToken();
    const headers = new AxiosHeaders({
      Authorization: 'Bearer ' + idToken,
    });
    const response = await axiosUtil.get('/user/get', headers);
    if (response) {
      const responseUser: User = response.data.user;
      setUser(responseUser);
    }
  };
  // トークン取得処理
  const getIdToken = async (): Promise<string | null> => {
    const idToken = await auth.currentUser?.getIdToken();
    return idToken || null;
  };

  // ログイン
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const handleLoginEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLoginEmail(event.target.value);
  };
  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLoginPassword(event.target.value);
  };

  const openLoginDialog = () => {
    // フォーム初期化
    setLoginEmail('');
    setLoginPassword('');

    // メニュー閉じる
    setUserMenuAnchorEl(null);
    // ダイアログ表示
    setIsLoginDialogOpen(true);
  };
  const closeLoginDialog = () => {
    setIsLoginDialogOpen(false);
  };

  const login = () => {
    new Promise<void>((resolve, reject) => {
      signInWithEmailAndPassword(auth, loginEmail, loginPassword)
        .then(async () => {
          // 認証成功した時
          console.log('login success');
          // ログイン成功時、諸々読み込み直す
          window.location.reload();
          resolve();
        })
        .catch(async (error) => {
          // TODO: エラーメッセージダイアログ
          console.log(error);
          reject(error);
        });
    });
  };
  // ログアウト
  const logout = async () => {
    // メニュー閉じる
    setUserMenuAnchorEl(null);
    await auth.signOut();
    // 画面更新
    window.location.reload();
  };

  // ユーザーメニュー
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const open = Boolean(userMenuAnchorEl);
  const handleUserButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };
  const handleUserButtonClose = () => {
    setUserMenuAnchorEl(null);
  };

  const init = async () => {
    await initUser();
    await fetchTimelines();
  };
  useEffect(() => {
    init();
  }, []);

  // 画面
  const ExpandMore = styled((props: ExpandMoreProps) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
  })(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  }));
  const getTimelineContent = (timeline: Timeline) => {
    let contentDiv = (
      <Typography variant="body1">{timeline.content}</Typography>
    );
    if (
      !showHate &&
      timeline.mayHate &&
      !timeline.isShow &&
      timeline.userId !== user?.id
    ) {
      contentDiv = (
        <Box>
          <Typography>
            <Skeleton
              animation={false}
              variant="text"
              sx={{ fontSize: '1rem' }}
            />
            <Skeleton
              animation={false}
              variant="text"
              sx={{ fontSize: '1rem' }}
            />
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row-reverse', pt: 1 }}>
            <Button
              variant="contained"
              color="warning"
              onClick={() => showHateTimeline(timeline)}
            >
              内容を表示する
            </Button>
          </Box>
        </Box>
      );
    }
    return contentDiv;
  };
  const dispTimelines = timelines.map((timeline) => (
    <Card key={timeline.postDocId} sx={{ my: 1 }}>
      <CardContent sx={{ p: 1 }}>
        {/* TODO:縦位置ずれ治す */}
        <Typography variant="h6">
          {/* TODO:アイコン */}
          {timeline.name} ({timeline.userId})
          {timeline.mayHate && <WarningIcon color="warning"></WarningIcon>}
        </Typography>
      </CardContent>
      <CardContent sx={{ p: 1 }}>{getTimelineContent(timeline)}</CardContent>
      <CardContent sx={{ display: 'flex', flexDirection: 'row-reverse', p: 1 }}>
        <Typography variant="caption">
          at{' '}
          {formatDateToStr(
            new Date(timeline.createAt * 1000),
            'yyyy/MM/dd hh:mm:ss',
          )}
        </Typography>
      </CardContent>
    </Card>
  ));
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {/* TODO: アイコン */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            hide-hate
          </Typography>
          <IconButton
            id="user-button"
            color="inherit"
            aria-controls={open ? 'user-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleUserButtonClick}
          >
            <PersonIcon></PersonIcon>
          </IconButton>
          <Menu
            id="user-menu"
            anchorEl={userMenuAnchorEl}
            open={open}
            onClose={handleUserButtonClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
            {user && <MenuItem disabled>{user.id}でログイン中</MenuItem>}
            {user && <MenuItem onClick={logout}>ログアウト</MenuItem>}
            {!user && <MenuItem onClick={openLoginDialog}>ログイン</MenuItem>}
          </Menu>
        </Toolbar>
      </AppBar>

      <Dialog open={errorDialog.isOpen} onClose={closeErrorDialog}>
        <DialogTitle>{errorDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{errorDialog.content}</Typography>
        </DialogContent>
        <DialogActions>
          <Box sx={{ flexGrou: 1 }}>
            <Button color="inherit" onClick={closeErrorDialog}>
              {errorDialog.cancelButtonLabel}
            </Button>
          </Box>
          {errorDialog.ok && (
            <Button color="error" onClick={errorDialog.ok}>
              {errorDialog.okButtonLabel}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={isLoginDialogOpen} onClose={closeLoginDialog}>
        <DialogContent>
          <FormControl>
            <TextField
              id="login-email"
              type="email"
              value={loginEmail}
              onChange={handleLoginEmailChange}
              label="メールアドレス"
            />
            <TextField
              id="login-password"
              type="password"
              value={loginPassword}
              onChange={handlePasswordChange}
              label="パスワード"
            />
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Box sx={{ flexGrou: 1 }}>
            <Button color="inherit" onClick={closeLoginDialog}>
              閉じる
            </Button>
          </Box>
          <Button autoFocus onClick={login}>
            ログイン
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={0}>
        <Grid xs={12} md={4} sx={{ p: 2 }}>
          <FormControl fullWidth>
            <Card>
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent>
                  <TextField
                    fullWidth
                    id="post"
                    multiline
                    rows={3}
                    value={post}
                    onChange={handlePostChange}
                  />
                </CardContent>
              </Collapse>
              <CardActions>
                <Box sx={{ flexGrow: 1 }}>
                  <ExpandMore
                    expand={expanded}
                    onClick={handleExpandClick}
                    aria-expanded={expanded}
                    aria-label="show more"
                  >
                    <ExpandMoreIcon />
                  </ExpandMore>
                </Box>
                <Button
                  variant="contained"
                  onClick={handlePostButtonClick}
                  disabled={!post}
                >
                  投稿する
                </Button>
              </CardActions>
            </Card>
          </FormControl>
        </Grid>
        <Grid xs={12} md={8} sx={{ p: 2 }}>
          {/* TODO: スクロールしても表示されるようにする */}
          <FormControlLabel
            control={
              <Switch checked={showHate} onChange={handleShowHateCheckbox} />
            }
            label={
              <Typography variant="body2">
                ヘイトスピーチの可能性がある投稿を表示する
              </Typography>
            }
          />
          <Box>{dispTimelines}</Box>
        </Grid>
      </Grid>
    </>
  );
};

export default App;
