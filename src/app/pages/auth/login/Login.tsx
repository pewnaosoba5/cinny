import React, { useMemo } from 'react'; import { Box, Text, color } from 'folds'; import { useSearchParams } from 'react-router-dom'; import { SSOAction } from 'matrix-js-sdk'; import { useAuthFlows } from '../../../hooks/useAuthFlows'; import { useAuthServer } from '../../../hooks/useAuthServer'; import { useParsedLoginFlows } from '../../../hooks/useParsedLoginFlows'; import { SSOLogin } from '../SSOLogin'; import { TokenLogin } from './TokenLogin'; import { getLoginPath } from '../../pathUtils'; import { usePathWithOrigin } from '../../../hooks/usePathWithOrigin'; import { LoginPathSearchParams } from '../../paths'; import { useClientConfig } from '../../../hooks/useClientConfig';

const getLoginTokenSearchParam = () => { const parmas = new URLSearchParams(window.location.search); const loginToken = parmas.get('loginToken'); return loginToken ?? undefined; };

const useLoginSearchParams = (searchParams: URLSearchParams): LoginPathSearchParams => useMemo( () => ({ username: searchParams.get('username') ?? undefined, email: searchParams.get('email') ?? undefined, loginToken: searchParams.get('loginToken') ?? undefined, }), [searchParams] );

export function Login() { const server = useAuthServer(); const { hashRouter } = useClientConfig(); const { loginFlows } = useAuthFlows(); const [searchParams] = useSearchParams(); const loginSearchParams = useLoginSearchParams(searchParams); const ssoRedirectUrl = usePathWithOrigin(getLoginPath(server)); const loginTokenForHashRouter = getLoginTokenSearchParam(); const absoluteLoginPath = usePathWithOrigin(getLoginPath(server));

if (hashRouter?.enabled && loginTokenForHashRouter) { window.location.replace( ${absoluteLoginPath}?loginToken=${encodeURIComponent(loginTokenForHashRouter)} ); }

const parsedFlows = useParsedLoginFlows(loginFlows.flows);

return ( Join the room on Cinny {parsedFlows.token && loginSearchParams.loginToken && ( )} {parsedFlows.sso && ( )} {!parsedFlows.sso && ( <Text style={{ color: color.Critical.Main }}> Login is not available on this server. )} ); }

