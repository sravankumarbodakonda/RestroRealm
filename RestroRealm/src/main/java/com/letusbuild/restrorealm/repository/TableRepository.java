package com.letusbuild.restrorealm.repository;

import com.letusbuild.restrorealm.entity.TableEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TableRepository extends JpaRepository<TableEntity,Long> {
}
