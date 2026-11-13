# PhantomLoaderQQNT 插件市场

插件列表查看支持搜索、依赖查看、安装、卸载和更新，使用 [PhantomLoaderQQNT-Plugin-Market](https://github.com/mlbv/PhantomLoaderQQNT-Plugin-Market) 作为插件目录。目录中的每个插件由仓库地址和分支指定，安装包从对应仓库的发行版或源码压缩包获取。

下载本仓库的[发行版](https://github.com/mlbv/LL-plugin-list-viewer/releases/latest)，解压后将插件目录放入 PhantomLoaderQQNT 配置目录下的 `plugins`，重启 QQNT 即可在设置中打开插件市场。

设置中的 `github.io` 开关使用查看器提供的合并清单和图标缓存。关闭后，插件直接读取市场目录和各插件仓库。镜像、代理和 GitHub Token 可以在设置中配置，现有 `list-viewer` 配置会继续使用。

![插件列表](./imgs/1.png)

从源码构建时，运行 `npm ci` 和 `npm run build`，将生成的 `dist` 目录作为插件安装。构建同时生成 `list-viewer.zip`。

插件开发者可以向[市场仓库](https://github.com/mlbv/PhantomLoaderQQNT-Plugin-Market)提交目录条目。发行版中的插件压缩包以 `manifest.json` 的 `slug` 或 `name` 命名时，市场会优先选用该文件。

本插件基于 [ltxhhz/LL-plugin-list-viewer](https://github.com/ltxhhz/LL-plugin-list-viewer)，沿用 GPL-3.0 许可证。
