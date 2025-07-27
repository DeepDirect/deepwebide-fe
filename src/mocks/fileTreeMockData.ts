import type { ApiFileTreeResponse } from '@/features/Repo/fileTree/types';

export const fileTreeMockData: ApiFileTreeResponse = {
  status: 200,
  message: '파일 트리 조회 성공',
  data: [
    {
      fileId: 1,
      fileName: 'src',
      fileType: 'FOLDER',
      parentId: null,
      path: 'src',
      children: [
        {
          fileId: 2,
          fileName: 'main',
          fileType: 'FOLDER',
          parentId: 1,
          path: 'src/main',
          children: [
            {
              fileId: 3,
              fileName: 'java',
              fileType: 'FOLDER',
              parentId: 2,
              path: 'src/main/java',
              children: [
                {
                  fileId: 4,
                  fileName: 'com',
                  fileType: 'FOLDER',
                  parentId: 3,
                  path: 'src/main/java/com',
                  children: [
                    {
                      fileId: 5,
                      fileName: 'example',
                      fileType: 'FOLDER',
                      parentId: 4,
                      path: 'src/main/java/com/example',
                      children: [
                        {
                          fileId: 6,
                          fileName: 'demo',
                          fileType: 'FOLDER',
                          parentId: 5,
                          path: 'src/main/java/com/example/demo',
                          children: [
                            {
                              fileId: 7,
                              fileName: 'DemoApplication.java',
                              fileType: 'FILE',
                              parentId: 6,
                              path: 'src/main/java/com/example/demo/DemoApplication.java',
                            },
                            {
                              fileId: 8,
                              fileName: 'controller',
                              fileType: 'FOLDER',
                              parentId: 6,
                              path: 'src/main/java/com/example/demo/controller',
                              children: [
                                {
                                  fileId: 9,
                                  fileName: 'UserController.java',
                                  fileType: 'FILE',
                                  parentId: 8,
                                  path: 'src/main/java/com/example/demo/controller/UserController.java',
                                },
                                {
                                  fileId: 10,
                                  fileName: 'ProductController.java',
                                  fileType: 'FILE',
                                  parentId: 8,
                                  path: 'src/main/java/com/example/demo/controller/ProductController.java',
                                },
                              ],
                            },
                            {
                              fileId: 11,
                              fileName: 'service',
                              fileType: 'FOLDER',
                              parentId: 6,
                              path: 'src/main/java/com/example/demo/service',
                              children: [
                                {
                                  fileId: 12,
                                  fileName: 'UserService.java',
                                  fileType: 'FILE',
                                  parentId: 11,
                                  path: 'src/main/java/com/example/demo/service/UserService.java',
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              fileId: 13,
              fileName: 'resources',
              fileType: 'FOLDER',
              parentId: 2,
              path: 'src/main/resources',
              children: [
                {
                  fileId: 14,
                  fileName: 'application.yml',
                  fileType: 'FILE',
                  parentId: 13,
                  path: 'src/main/resources/application.yml',
                },
                {
                  fileId: 15,
                  fileName: 'static',
                  fileType: 'FOLDER',
                  parentId: 13,
                  path: 'src/main/resources/static',
                },
                {
                  fileId: 16,
                  fileName: 'templates',
                  fileType: 'FOLDER',
                  parentId: 13,
                  path: 'src/main/resources/templates',
                },
              ],
            },
          ],
        },
        {
          fileId: 17,
          fileName: 'test',
          fileType: 'FOLDER',
          parentId: 1,
          path: 'src/test',
          children: [
            {
              fileId: 18,
              fileName: 'java',
              fileType: 'FOLDER',
              parentId: 17,
              path: 'src/test/java',
              children: [
                {
                  fileId: 19,
                  fileName: 'DemoApplicationTests.java',
                  fileType: 'FILE',
                  parentId: 18,
                  path: 'src/test/java/DemoApplicationTests.java',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      fileId: 20,
      fileName: 'README.md',
      fileType: 'FILE',
      parentId: null,
      path: 'README.md',
    },
    {
      fileId: 21,
      fileName: 'pom.xml',
      fileType: 'FILE',
      parentId: null,
      path: 'pom.xml',
    },
    {
      fileId: 22,
      fileName: '.gitignore',
      fileType: 'FILE',
      parentId: null,
      path: '.gitignore',
    },
  ],
};
