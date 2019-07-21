/**
 * 映射此方法为Action
 * @param type method类型，默认为get
 * @param path 映射到的路由，默认为action名称
 */
export declare function Mapping(type?: string, path?: string): (target: any, name: string) => void;
/**
 * 映射此方法为Action，允许所有类型的method请求
 * @param path 映射到的路由，默认为action名称
 */
export declare function AllMapping(path?: string): (target: any, name: string) => void;
/**
 * 映射此方法为Action，只允许get请求
 * @param path 映射到的路由，默认为action名称
 */
export declare function GetMapping(path?: string): (target: any, name: string) => void;
/**
 * 映射此方法为Action，只允许post请求
 * @param path 映射到的路由，默认为action名称
 */
export declare function PostMapping(path?: string): (target: any, name: string) => void;
/**
 * 映射此方法为Action，只允许put请求
 * @param path 映射到的路由，默认为action名称
 */
export declare function PutMapping(path?: string): (target: any, name: string) => void;
/**
 * 映射此方法为Action，只允许patch请求
 * @param path 映射到的路由，默认为action名称
 */
export declare function PatchMapping(path?: string): (target: any, name: string) => void;
/**
 * 映射此方法为Action，只允许delete请求
 * @param path 映射到的路由，默认为action名称
 */
export declare function DeleteMapping(path?: string): (target: any, name: string) => void;
/**
 * 映射此方法为Action，只允许head请求
 * @param path 映射到的路由，默认为action名称
 */
export declare function HeadMapping(path?: string): (target: any, name: string) => void;
