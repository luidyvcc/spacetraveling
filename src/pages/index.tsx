import { useCallback, useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { results, next_page } = postsPagination;

  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState(next_page);

  const fetchNextPage = useCallback(async () => {
    const newResults = await fetch(next_page).then(res => res.json());

    const newPosts = newResults.results.map(post => ({
      uid: post.uid,
      first_publication_date: format(
        new Date(post.last_publication_date),
        'dd MMM YYY',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setPosts([...posts, ...newPosts]);
    setNextPage(newResults.next_page);
  }, [next_page, posts]);

  return (
    <>
      <Head>
        <title>Posts</title>
      </Head>

      <main className={commonStyles.container}>
        <div className={styles.header}>
          <img src="/images/logo.svg" alt="logo" />
        </div>

        {posts.map(post => (
          <div className={styles.posts} key={post.uid}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <time>
                    <img src="/icons/calendar.svg" alt="Calendar" />
                    {post.first_publication_date}
                  </time>
                  <div>
                    <img src="/icons/user.svg" alt="User" />
                    {post.data.author}
                  </div>
                </div>
              </a>
            </Link>
          </div>
        ))}

        {nextPage && (
          <div className={styles.footer}>
            <button type="button" onClick={fetchNextPage}>
              Carregar mais posts
            </button>
          </div>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 20,
      page: 1,
    }
  );

  const results = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: format(
      new Date(post.last_publication_date),
      'dd MMM YYY',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  return {
    props: {
      postsPagination: {
        results,
        next_page: postsResponse.next_page,
      },
    },
  };
};
