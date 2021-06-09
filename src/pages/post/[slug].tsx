import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

interface ContentType {
  body: string[];
  heading: string;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const { data } = post;

  const totalWords = post.data.content.reduce((acc, obj) => {
    const bodyText = `${RichText.asText(obj.body)} ${obj.heading}`;
    const textLength = bodyText.split(/\s/g).length;
    return acc + textLength;
  }, 0);

  const readingTime = Math.ceil(totalWords / 200);

  const formatedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  return (
    <>
      <Header />

      <div className={styles.hero}>
        <img src={data.banner.url} alt={data.title} />
      </div>

      <main className={commonStyles.container}>
        <div className={styles.content}>
          <strong>{data.title}</strong>

          <div className={styles.info}>
            <time>
              <img src="/icons/calendar.svg" alt="Calendar" />
              {formatedDate}
            </time>
            <span>
              <img src="/icons/user.svg" alt="User" />
              {post.data.author}
            </span>
            <span>
              <img src="/icons/clock.svg" alt="User" />
              {readingTime} min
            </span>
          </div>

          {data.content.map(item => {
            return (
              <div key={Math.random()} className={styles.body}>
                <strong>{item.heading}</strong>
                <div>
                  {item.body.map(body => (
                    <p key={body.text}>{body.text}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'post'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map((content: ContentType) => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
